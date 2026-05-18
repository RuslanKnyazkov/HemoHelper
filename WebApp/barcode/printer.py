import win32print
import win32api
from utility.logging import logger
from datetime import datetime as dt
import json
import os


class PrintManager():
    @staticmethod
    def get_default_printer():
        try:
            with open("printer_config.json", "r") as file:
                printer = json.load(file)
                return printer['printer-name']
        except FileNotFoundError:
            print("Файл config.json не найден")
            return None
        except json.JSONDecodeError:
            print("Ошибка: файл printer_config.json пуст или содержит неверный JSON")
            return None
        except KeyError:
            print("Ошибка: в JSON нет ключа 'printer-name'")
            return None

    def print_barcode(self, zpl: str, printer_name: str = None, retry: int = 1):
        if isinstance(retry, str):
            retry = int(retry)

        current_printer = printer_name or self.get_default_printer()
        logger.info(
            f"Текущий принтер {current_printer}. Отправил заявку на печать {zpl}")

        while retry > 0:

            try:
                hPrinter = win32print.OpenPrinter(current_printer)
                job_info = ("Barcode Print", None, "RAW")
                job_id = win32print.StartDocPrinter(hPrinter, 1, job_info)
                win32print.StartPagePrinter(hPrinter)
                win32print.WritePrinter(hPrinter, zpl.strip().encode('utf-8'))
                win32print.EndPagePrinter(hPrinter)
                win32print.EndDocPrinter(hPrinter)
                win32print.ClosePrinter(hPrinter)
                retry -= 1
            except Exception as e:
                logger.error(f"❌ Ошибка печати на {printer_name}: {e}")
                return False
        return True


class ZPL:
    def __init__(self, mode=False, text=False, code="B2N",
                 lot=False, size='m', anchor="c", volume=False,
                 barcode=False, number=False, date=False, **kwargs):
        self.code = code
        self.start = "^XA^PW406^LL360^LS0"
        self.mode = mode
        self.text = text
        self.lot = lot
        self.barcode = barcode
        self.number = number
        self.date = date
        self.volume = volume
        self.end = "^XZ"
        self.font = {"s": 10, 'm': 15, "l": 30}
        self.geometry_item = {"h": 20, "c": 50, "b": 10}
        self.size = size
        self.anchor = anchor
        self.build = []

    def add_mode(self, mode):
        self.build.append(
            f"^FO30,{self.geometry_item[self.anchor]}^ADN,{self.font[self.size]},{self.font[self.size]}^FB388,1,0,C^FD{mode}^FS")

    def add_text(self, text):
        font = self.font['m']
        if len(text) > 10:
            font = self.font['s']
        self.build.append(
            f"^FO30,{self.geometry_item[self.anchor]}^ADN,{font},{font}^FB388,1,0,C^FD{text}^FS")

    def add_lot(self, lot):
        self.build.append(
            f"^FO30,100^ADN,{self.font[self.size]},{self.font[self.size]}^FB388,1,0,C^FDlot: {lot}^FS")

    def add_barcode(self, number_barcode):
        by_value = 1.5 if self.code == "B2N" else 1
        self.build.append(
            f"^FO110,60^BY{by_value}^{self.code},80,N,N,N^FD{number_barcode}^FS")

    def add_number(self, number):
        self.build.append(
            f"^FO30,150^ADN,{self.font[self.size]},{self.font[self.size]}^FB388,1,0,C^FD{number}^FS")

    def add_volume(self, volume):
        suffix = "mkl" if len(volume) > 1 else "ml"
        self.build.append(
            f"^FO30,150^ADN,20,20^FB388,1,0,C^FD{volume}{suffix}^FS")

    def add_date(self):
        now = dt.now().strftime("%d/%m/%Y")
        self.build.append(
            f"^FO30,180^ADN,20,20^FB388,1,0,C^FD{now}^FS")

    def build_zpl(self) -> str:
        self.build = [self.start]
        if self.mode:
            self.add_mode(self.mode)
        if self.text:
            self.add_text(self.text)
        if self.lot:
            self.add_lot(self.lot)
        if self.volume:
            self.add_volume(self.volume)
        if self.barcode:
            self.add_barcode(self.barcode)
        if self.number:
            self.add_number(self.number)
        if self.date:
            self.add_date()
        self.build.append(self.end)
        return "\n".join(self.build)


class ZplGenerator:
    @staticmethod
    def create_simple_text_zpl(**kwargs) -> str:
        return ZPL(**kwargs).build_zpl()


if __name__ == "__main__":

    test = PrintManager()
    print(test.get_default_printer())
