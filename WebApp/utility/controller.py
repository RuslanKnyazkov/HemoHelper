import pyautogui
import time
from .logging import logger


class PcController:
    state = True

    def prevent_sleep(self):
        """
        Двигает мышку каждые 5 минут, чтобы компьютер не засыпал
        """
        logger.info(f"Активный статус {self.state}")
        try:
            while self.state:
                time.sleep(200)
                pyautogui.click()

                logger.info(f"🖱️ Клик по мыши в {time.strftime('%H:%M:%S')}")

                # Ждем 5 минут (300 секунд)
                time.sleep(400)

        except KeyboardInterrupt:
            logger.info("\n🔴 Mouse jiggler остановлен")
