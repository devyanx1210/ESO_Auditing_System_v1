-- Add PDF template support to document_templates
ALTER TABLE document_templates
    ADD COLUMN pdf_path        VARCHAR(500) NULL AFTER content,
    ADD COLUMN field_positions JSON         NULL AFTER pdf_path;
