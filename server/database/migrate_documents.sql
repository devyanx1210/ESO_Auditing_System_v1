CREATE TABLE IF NOT EXISTS document_templates (
    template_id INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)     NOT NULL,
    content     LONGTEXT         NOT NULL,
    is_default  TINYINT(1)       NOT NULL DEFAULT 0,
    created_by  INT UNSIGNED     NOT NULL,
    created_at  DATETIME         NOT NULL DEFAULT NOW(),
    updated_at  DATETIME         NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
