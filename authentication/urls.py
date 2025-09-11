from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management endpoints
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('change-password/', views.change_password, name='change_password'),
    path('users/', views.UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    
    # Permission management endpoints
    path('permissions/', views.PermissionListCreateView.as_view(), name='permission_list'),
    path('permissions/<int:pk>/', views.PermissionDetailView.as_view(), name='permission_detail'),
]
