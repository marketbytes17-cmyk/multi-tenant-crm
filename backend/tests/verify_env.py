import os
import sys
import importlib

# Add backend directory to sys.path so app imports resolve cleanly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def check_python_version():
    major = sys.version_info.major
    minor = sys.version_info.minor
    is_ok = major > 3 or (major == 3 and minor >= 10)
    version_str = f"{major}.{minor}.{sys.version_info.micro}"
    return is_ok, version_str

def check_package(module_name: str, pip_name: str | None = None):
    pip_pkg = pip_name or module_name
    try:
        mod = importlib.import_module(module_name)
        ver = getattr(mod, "__version__", "installed")
        return True, ver, pip_pkg
    except ImportError:
        return False, "Not Installed", pip_pkg

def main():
    print("=" * 60)
    print("  MULTI-TENANT CRM - ENVIRONMENT & DEPENDENCY AUDIT")
    print("=" * 60)

    # 1. Check Python Version
    py_ok, py_ver = check_python_version()
    status_str = "[OK]" if py_ok else "[ACTION NEEDED]"
    print(f"\n1. Python Runtime:")
    print(f"   Status  : {status_str}")
    print(f"   Version : Python {py_ver} (Required: >= 3.10)")

    # 2. Package Audit List
    packages_to_check = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
        ("pydantic_settings", "pydantic-settings"),
        ("sqlalchemy", "sqlalchemy"),
        ("psycopg2", "psycopg2-binary"),
        ("celery", "celery"),
        ("redis", "redis"),
        ("httpx", "httpx"),
        ("dotenv", "python-dotenv"),
    ]

    print("\n2. Package Dependencies Audit:")
    missing_pip = []
    
    for mod_name, pip_name in packages_to_check:
        ok, ver, p_pkg = check_package(mod_name, pip_name)
        if ok:
            print(f"   [OK]            {mod_name:<20} -> {ver}")
        else:
            print(f"   [ACTION NEEDED] {mod_name:<20} -> NOT INSTALLED")
            missing_pip.append(p_pkg)

    # 3. App Config Import Verification
    print("\n3. Application Configuration Audit:")
    config_ok = False
    config_err = ""
    try:
        from app.config import settings
        config_ok = True
        config_info = f"Project: '{settings.PROJECT_NAME}' | Graph API: '{settings.META_GRAPH_API_VERSION}'"
    except Exception as e:
        config_err = str(e)

    if config_ok:
        print(f"   [OK]            backend/app/config.py loaded successfully.")
        print(f"                   {config_info}")
    else:
        print(f"   [ACTION NEEDED] backend/app/config.py failed to load.")
        print(f"                   Error: {config_err}")

    # 4. Summary & Action Items
    print("\n" + "=" * 60)
    print("  SUMMARY & ACTION ITEMS")
    print("=" * 60)

    all_ready = py_ok and (len(missing_pip) == 0) and config_ok

    if all_ready:
        print(" [OK] ALL AUDIT CHECKS PASSED! Your local environment is 100% ready.")
    else:
        print(" [ACTION NEEDED] Action needed to complete environment setup:\n")
        if missing_pip:
            print("   Run the following command to install missing dependencies:")
            print(f"   pip install {' '.join(missing_pip)}\n")
            print("   Or install all project dependencies at once:")
            print("   pip install -r requirements.txt\n")
        if not py_ok:
            print("   Please upgrade your Python runtime to version >= 3.10.")

    print("=" * 60)

if __name__ == "__main__":
    main()
