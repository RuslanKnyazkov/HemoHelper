import win32print
import win32api
import win32con
from datetime import datetime as dt


class PrintManager():
    def __init__(self):

        self.default_printer: str = "ZDesigner ZD410-203dpi ZPL"

    def get_default_printer(self) -> str:
        return self.default_printer

    def insert_mode_in_label(self, number, mode: str = None) -> str:

        zpl = f"""
                ^XA
                ^PW406
                ^LL360
                ^LS0

                ^FO30,10
                ^A0N,20,20
                ^FB388,1,0,C
                ^FD{mode}^FS

                ^FO20,30
                ^BY1,2,50
                ^BCN,50,Y,N,N
                ^FD{number}^FS

                ^FO50,155
                ^A0N,30,30
                ^FB348,1,0,C
                ^FD{number}^FS

                ^FO30,180
                ^A0N,20,20
                ^FB388,1,0,C
                ^FD{dt.now().strftime("%D")}^FS

                ^XZ
                """
        return zpl

    def print_barcode(self, zpl: str,  mode: str = None):
        if mode in ["default", None]:
            retry = 1
        else:
            retry = 2

        while retry > 0:
            hPrinter = win32print.OpenPrinter(self.get_default_printer())
            job_info = ("Barcode Print", None, "RAW")
            job_id = win32print.StartDocPrinter(hPrinter, 1, job_info)
            win32print.StartPagePrinter(hPrinter)
            win32print.WritePrinter(hPrinter, zpl.strip().encode('utf-8'))
            win32print.EndPagePrinter(hPrinter)
            win32print.EndDocPrinter(hPrinter)
            win32print.ClosePrinter(hPrinter)
            retry -= 1

    def create_double_zpl(self) -> str:
        zpl = f"""^XA
            ^CI28
            ^PW406
            ^LL360
            ^LS0

            ^FO30,80
            ^ADN,30,30  # Шрифт D - более широкий
            ^FB388,1,0,C
            ^FDDubli^FS

            ^FO30,150
            ^ADN,20,20  # Шрифт D
            ^FB388,1,0,C
            ^FD{dt.now().strftime("%D")}^FS

            ^XZ"""
        return zpl

    def create_virtual_arhive(self, number: str) -> None:
        zpl = f"""^XA
            ^CI28
            ^PW406
            ^LL360
            ^LS0

            ^FO30,50
            ^ADN,30,30  # Шрифт D - более широкий
            ^FB388,1,0,C
            ^FDLAMI^FS

            ^FO30,90
            ^ADN,30,30  # Шрифт D - более широкий
            ^FB388,1,0,C
            ^FD{number}^FS

            ^FO30,150
            ^ADN,20,20  # Шрифт D
            ^FB388,1,0,C
            ^FD{dt.now().strftime("%D")}^FS

            ^XZ"""
        return zpl

    def create_label_cortisol(self) -> str:
        zpl = f"""^XA
            ^CI28
            ^PW406
            ^LL360
            ^LS0

            ^FO30,80
            ^ADN,30,30  # Шрифт D - более широкий
            ^FB388,1,0,C
            ^FDSluna^FS

            ^FO30,150
            ^ADN,20,20  # Шрифт D
            ^FB388,1,0,C
            ^FD{dt.now().strftime("%D")}^FS

            ^XZ"""
        return zpl
