import pyautogui
import time


class PcController:
    state = True

    def prevent_sleep(self,):
        """
        Двигает мышку каждые 5 минут, чтобы компьютер не засыпал
        """
        print(f"Активный статус {self.state}")
        try:
            while self.state:
                time.sleep(200)
                pyautogui.click()

                print(f"🖱️ Клик по мыши в {time.strftime('%H:%M:%S')}")

                # Ждем 5 минут (300 секунд)
                time.sleep(400)

        except KeyboardInterrupt:
            print("\n🔴 Mouse jiggler остановлен")
