from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomerProfile, SocialIdentity, User


class SocialIdentityInline(admin.TabularInline):
    model = SocialIdentity
    extra = 0
    can_delete = False
    readonly_fields = (
        "provider",
        "subject",
        "email_at_link",
        "created_at",
        "last_login_at",
    )


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    ordering = ("email",)
    list_display = ("email", "first_name", "last_name", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff", "date_joined")
    search_fields = ("email", "phone", "first_name", "last_name")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal", {"fields": ("first_name", "last_name", "phone")}),
        (
            "Access",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role", "is_staff"),
            },
        ),
    )
    inlines = (SocialIdentityInline,)


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "allergy_count", "has_medical_notes", "updated_at")
    search_fields = ("user__email", "user__phone", "medical_notes")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("user",)

    @admin.display(description="Allergies")
    def allergy_count(self, obj):
        return len(obj.allergies)

    @admin.display(boolean=True, description="Medical notes")
    def has_medical_notes(self, obj):
        return bool(obj.medical_notes)


@admin.register(SocialIdentity)
class SocialIdentityAdmin(admin.ModelAdmin):
    list_display = ("provider", "email_at_link", "user", "created_at", "last_login_at")
    list_filter = ("provider", "created_at")
    search_fields = ("email_at_link", "subject", "user__email")
    readonly_fields = (
        "user",
        "provider",
        "subject",
        "email_at_link",
        "created_at",
        "last_login_at",
    )
