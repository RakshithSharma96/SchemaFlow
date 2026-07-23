import pytest
from app.agents.planner import PlannerAgent
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_planner_sql_analysis_fallback():
    agent = PlannerAgent()
    context = {"question": "What is the highest selling item?"}
    
    with patch("app.agents.planner.get_llm_provider") as mock_get_llm:
        mock_llm = AsyncMock()
        # Simulate a bad JSON response to trigger fallback
        mock_llm.generate_response.return_value = "This is not JSON"
        mock_get_llm.return_value = mock_llm
        
        result_context = await agent.execute(context)
        
        assert "plan" in result_context
        plan = result_context["plan"]
        assert plan["task"] == "sql_analysis"
        assert plan["needs_schema"] is True
        assert plan["needs_chart"] is True
        assert plan["needs_statistics"] is True

@pytest.mark.asyncio
async def test_planner_sql_analysis_success():
    agent = PlannerAgent()
    context = {"question": "Can you explain this sql?"}
    
    with patch("app.agents.planner.get_llm_provider") as mock_get_llm:
        mock_llm = AsyncMock()
        mock_llm.generate_response.return_value = '{"task": "explain_sql", "needs_schema": false, "needs_chart": false, "needs_statistics": false}'
        mock_get_llm.return_value = mock_llm
        
        result_context = await agent.execute(context)
        
        assert "plan" in result_context
        plan = result_context["plan"]
        assert plan["task"] == "explain_sql"
        assert plan["needs_schema"] is False
