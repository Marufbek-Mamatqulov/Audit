from django.urls import path
from . import views

app_name = 'departments'

urlpatterns = [
    # Department CRUD endpoints
    path('', views.DepartmentListCreateView.as_view(), name='department_list'),
    path('<int:pk>/', views.DepartmentDetailView.as_view(), name='department_detail'),
    
    # Department tree and statistics
    path('tree/', views.department_tree, name='department_tree'),
    path('stats/', views.department_stats, name='all_department_stats'),
    path('<int:pk>/stats/', views.department_stats, name='department_stats'),
    
    # User's department
    path('my-department/', views.my_department, name='my_department'),
]
