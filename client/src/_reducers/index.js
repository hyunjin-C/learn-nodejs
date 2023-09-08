import { combineReducers } from "redux";
import user from "./user_reducer";

// 여러 개의 reducer를 combineReducer를 통해 rootReducer로 합쳐줌
const rootReducer = combineReducers({
  user,
});

export default rootReducer;
