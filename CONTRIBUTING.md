# Contributing to LAMI Project

Thank you for considering contributing to the LAMI Project! We welcome contributions from everyone.

## How to Contribute

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Commit your changes
5. Push to your branch
6. Create a pull request

## Development Setup

To set up a development environment:

```bash
# Clone the repository
git clone https://github.com/your-username/LAMI_Project.git

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows
cd venv\Scripts
activate.bat

cd ../../

# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python WebApp/manage.py migrate

# Create a superuser
python WebApp/manage.py createsuperuser

# Run the development server
python WebApp/manage.py runserver
```

## Code Style

Please follow the existing code style in the project. We use standard Python and Django conventions.

## Reporting Bugs

If you find a bug, please open an issue with:

- A clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, browser, etc.)

## Feature Requests

We welcome feature requests! Please open an issue with a detailed description of the feature you'd like to see.