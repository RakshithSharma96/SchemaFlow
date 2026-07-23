"""
Authentication API Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.domain import User, RefreshToken, Preference
from app.models.requests import UserRegisterRequest, UserLoginRequest, RefreshTokenRequest
from app.models.responses import TokenResponse
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register(request: UserRegisterRequest, response: Response, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        name=request.name,
        email=request.email,
        password_hash=get_password_hash(request.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create default preferences
    pref = Preference(user_id=user.id)
    db.add(pref)
    db.commit()

    return _generate_tokens_for_user(user, response, db)

@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.lower()).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    return _generate_tokens_for_user(user, response, db)

@router.post("/refresh", response_model=TokenResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    # Look for refresh token in HttpOnly cookie first, fallback to request body if needed
    token = request.cookies.get("refresh_token")
    if not token:
        # In a real setup you might accept it in the JSON body, but we follow the HttpOnly cookie pattern strictly
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    payload = verify_token(token, token_type="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    user_id = payload.get("sub")
    db_token = db.query(RefreshToken).filter(RefreshToken.token == token, RefreshToken.user_id == user_id, RefreshToken.is_revoked == False).first()
    if not db_token:
        raise HTTPException(status_code=401, detail="Refresh token revoked or invalid")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    # Rotate refresh token
    db_token.is_revoked = True
    db.commit()
    
    return _generate_tokens_for_user(user, response, db)

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if token:
        db_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()
        if db_token:
            db_token.is_revoked = True
            db.commit()
            
    response.delete_cookie("refresh_token", path="/", httponly=True, secure=True, samesite="lax")
    return {"success": True}

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "last_login": user.last_login
    }

def _generate_tokens_for_user(user: User, response: Response, db: Session) -> dict:
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    # Store refresh token in DB
    payload = verify_token(refresh_token, token_type="refresh")
    db_token = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    )
    db.add(db_token)
    db.commit()
    
    # Set HttpOnly cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=7 * 24 * 60 * 60 # 7 days
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }
