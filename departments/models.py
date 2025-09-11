from django.db import models


class Department(models.Model):
    """Department model"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    manager = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_departments'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subdepartments'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def full_path(self):
        """Return the full path of the department including parent departments"""
        if self.parent:
            return f"{self.parent.full_path} / {self.name}"
        return self.name

    def get_all_users(self):
        """Get all users in this department and its subdepartments"""
        from authentication.models import User
        department_ids = [self.id] + list(self.get_all_subdepartments().values_list('id', flat=True))
        return User.objects.filter(department_id__in=department_ids)

    def get_all_subdepartments(self):
        """Get all subdepartments recursively"""
        subdepartments = Department.objects.filter(parent=self)
        all_subdepartments = subdepartments
        for subdept in subdepartments:
            all_subdepartments = all_subdepartments | subdept.get_all_subdepartments()
        return all_subdepartments
