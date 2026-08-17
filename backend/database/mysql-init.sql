-- Square Cloud BRS — MySQL setup (run as a user with CREATE privileges)
-- Matches the credentials in backend/.env.example
CREATE DATABASE IF NOT EXISTS square_cloud_brs
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'square_brs'@'localhost'
  IDENTIFIED BY '0Fl0SOLweE97lsj';

GRANT ALL PRIVILEGES ON square_cloud_brs.* TO 'square_brs'@'localhost';

FLUSH PRIVILEGES;
