# LAMI Project

This is a Django-based web application for laboratory management and automation.

## Project Structure

```
LAMI_Project/
├── WebApp/
│   ├── barcode/
│   ├── task/
│   ├── teachbase/
│   ├── user/
│   ├── utility/
│   └── WebApp/
├── venv/
├── static/
├── templates/
├── manage.py
├── requirements.txt
├── start.bat
└── default_start.bat
```

## Installation

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate.bat`
   - Linux/Mac: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the development server: `python WebApp/manage.py runserver`

## Usage

The application provides barcode printing, laboratory automation, and educational modules for laboratory workflows.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.