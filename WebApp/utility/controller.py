import pyautogui
import time
import random


class PcController:
    state = True

    def prevent_sleep(self,):
        """
        Двигает мышку каждые 5 минут, чтобы компьютер не засыпал
        """
        print(f"Активный статус {self.state}")
        try:
            while self.state:
                # Получаем текущую позицию
                x, y = pyautogui.position()

                # Двигаем немного вправо-влево
                pyautogui.moveTo(x + random.randint(1, 5), y)
                time.sleep(0.1)
                pyautogui.moveTo(x, y)

                print(f"🖱️ Мышь пошевелилась в {time.strftime('%H:%M:%S')}")

                # Ждем 5 минут (300 секунд)
                time.sleep(200)

        except KeyboardInterrupt:
            print("\n🔴 Mouse jiggler остановлен")
