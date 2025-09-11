import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import departmentReducer from './slices/departmentSlice';
import fileReducer from './slices/fileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    department: departmentReducer,
    file: fileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
