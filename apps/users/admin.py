from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Tenant, TenantMember, UsageQuota

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "full_name", "primary_tenant", "is_super_admin", "is_staff")
    list_filter = ("is_super_admin", "is_staff", "is_active")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Configurações Agent-BI", {"fields": ("primary_tenant", "is_super_admin", "avatar_url")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Configurações Agent-BI", {"fields": ("email", "full_name", "primary_tenant", "is_super_admin")}),
    )
    search_fields = ("email", "username", "full_name")
    ordering = ("email",)

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "status", "max_projects", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}

@admin.register(UsageQuota)
class UsageQuotaAdmin(admin.ModelAdmin):
    list_display = ("user", "reports_generated_count", "max_reports_per_month", "reset_date")
    list_editable = ("max_reports_per_month",)
    search_fields = ("user__email", "user__full_name")
    list_filter = ("reset_date",)

@admin.register(TenantMember)
class TenantMemberAdmin(admin.ModelAdmin):
    list_display = ("user", "tenant", "role", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("user__email", "tenant__name")
