from django.http import JsonResponse
import win32print
import win32api
import win32con
from datetime import datetime as dt


class PrintManager():
    def __init__(self):

        self.default_printer: str = "ZDesigner ZD410-203dpi ZPL"

    def get_default_printer(self) -> str:
        return self.default_printer

    def print_barcode(self, zpl: str,  mode: str = "default", retry: int = 1):
        if isinstance(retry, str):
            retry = int(retry)

        while retry > 0:
            try:
                hPrinter = win32print.OpenPrinter(self.get_default_printer())
                job_info = ("Barcode Print", None, "RAW")
                job_id = win32print.StartDocPrinter(hPrinter, 1, job_info)
                win32print.StartPagePrinter(hPrinter)
                win32print.WritePrinter(hPrinter, zpl.strip().encode('utf-8'))
                win32print.EndPagePrinter(hPrinter)
                win32print.EndDocPrinter(hPrinter)
                win32print.ClosePrinter(hPrinter)
                retry -= 1
            except Exception as e:
                print(e)
                break
        return True  # Заглушка для отсутствующего принтера


class ZPL:
    def __init__(self, mode=False, text=False, code="B2N",
                 lot=False, size='m', anchor="c", volume=False,
                 barcode=False, number=False, data=False, **kwargs):

        self.code = code

        self.start = "^XA^PW406^LL360^LS0"
        self.mode = mode
        self.text = text
        self.lot = lot
        self.barcode = barcode
        self.number = number
        self.data = data
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
        self.build.append(
            f"^FO30,{self.geometry_item[self.anchor]}^ADN,{self.font[self.size]},{self.font[self.size]}^FB388,1,0,C^FD{text}^FS")

    def add_lot(self, lot):
        self.build.append(
            f"^FO30,100^ADN,{self.font[self.size]},{self.font[self.size]}^FB388,1,0,C^FDlot: {lot}^FS")

    def add_barcode(self, number_barcode):
        self.build.append(
            f"^FO110,60^BY{1.5 if self.code == "B2N" else 1}^{self.code},80,N,N,N^FD{number_barcode}^FS")

    def add_number(self, number):
        self.build.append(
            f"^FO30,150^ADN,{self.font[self.size]},{self.font[self.size]}^FB388,1,0,C^FD{number}^FS")

    def add_volume(self, volume):
        self.build.append(
            f"^FO30,150^ADN,20,20 ^FB388,1,0,C^FD{volume + "mkl" if len(volume) > 1 else volume + "ml"}^FS")

    def add_data(self):
        self.build.append(
            f"^FO30,180^ADN,20,20 ^FB388,1,0,C^FD{dt.now().strftime("%d/%m/%Y")}^FS")

    def build_zpl(self) -> str:
        """
        Docstring for build_zpl
        Bilder function insert block zpl in list and return ready code.
        :return: Description
        :rtype: str
        """
        self.build.append(self.start)
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
        if self.data:
            self.add_data()
        self.build.append(self.end)
        print("\n".join(self.build))
        return "\n".join(self.build)


class ZplGenerator:

    @staticmethod
    def create_simple_text_zpl(**kwargs) -> str:
        """
        Docstring for create_simple_zpl
        Function building zpl code with argument step by step -->
        [mode or text | barcode , number | lot , volume | data]

        :param kwargs: Dict[int, str] differents params for building zpl code
        :return: ZPL object
        :rtype: str
        """
        return ZPL(**kwargs, data=True).build_zpl()


if __name__ == "__main__":
    zpl = ZplGenerator()
    printer = PrintManager()
    printer.print_barcode(zpl.create_simple_text_zpl())
