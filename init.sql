CREATE DATABASE IF NOT EXISTS rapidfix_users;
CREATE DATABASE IF NOT EXISTS rapidfix_technicians;
CREATE DATABASE IF NOT EXISTS rapidfix_dispatch;

GRANT ALL PRIVILEGES ON rapidfix_users.*       TO 'root'@'%';
GRANT ALL PRIVILEGES ON rapidfix_technicians.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON rapidfix_dispatch.*    TO 'root'@'%';

FLUSH PRIVILEGES;