import pyautogui
import time
import logging

class PcController:
    state = True
    logger = logging.getLogger(__name__)

    def prevent_sleep(self):
        """
        Двигает мышку каждые 5 минут, чтобы компьютер не засыпал
        """
        self.logger.info(f"Активный статус {self.state}")
        try:
            while self.state:
                time.sleep(200)
                pyautogui.click()

                self.logger.info(f"🖱️ Клик по мыши в {time.strftime('%H:%M:%S')}")

                # Ждем 5 минут (300 секунд)
                time.sleep(400)

        except KeyboardInterrupt:
            self.logger.info("\n🔴 Mouse jiggler остановлен")
