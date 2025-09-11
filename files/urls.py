from django.urls import path
from . import views

app_name = 'files'

urlpatterns = [
    # File CRUD endpoints
    path('', views.FileListCreateView.as_view(), name='file_list'),
    path('<int:pk>/', views.FileDetailView.as_view(), name='file_detail'),
    
    # File management
    path('<int:pk>/versions/', views.file_versions, name='file_versions'),
    path('<int:pk>/upload-version/', views.upload_file_version, name='upload_file_version'),
    path('<int:pk>/lock/', views.toggle_file_lock, name='toggle_file_lock'),
    
    # OnlyOffice integration
    path('<int:file_id>/onlyoffice-config/', views.onlyoffice_config, name='onlyoffice_config'),
    path('<int:file_id>/onlyoffice-callback/', views.onlyoffice_callback, name='onlyoffice_callback'),
    
    # OnlyOffice Editor and Viewer
    path('<int:pk>/edit/', views.file_editor_view, name='file_editor'),
    path('<int:pk>/view/', views.file_viewer_view, name='file_viewer'),
    
    # Permission management
    path('<int:file_id>/grant-permission/', views.grant_file_permission, name='grant_file_permission'),
    path('permissions/', views.file_permissions_list, name='file_permissions_list'),
    path('permissions/<int:pk>/', views.file_permission_delete, name='file_permission_delete'),
    
    # User-specific endpoints
    path('my-files/', views.my_files, name='my_files'),
    path('shared-files/', views.shared_files, name='shared_files'),
]
