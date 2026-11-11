CREATE DATABASE IF NOT EXISTS `hms_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hms_db`;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE role_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    menu JSON DEFAULT NULL,
    dashboard JSON DEFAULT NULL,
    custom JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lab_cbc` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `invoice_id` INT NOT NULL,
  `hemoglobin` DECIMAL(8,2) NULL,
  `rbc_count` DECIMAL(10,2) NULL,
  `wbc_count` DECIMAL(10,2) NULL,
  `platelets` DECIMAL(10,2) NULL,
  `hct` DECIMAL(8,2) NULL,
  `mcv` DECIMAL(8,2) NULL,
  `mch` DECIMAL(8,2) NULL,
  `mchc` DECIMAL(8,2) NULL,
  `neutrophils` DECIMAL(8,2) NULL,
  `lymphocytes` DECIMAL(8,2) NULL,
  `monocytes` DECIMAL(8,2) NULL,
  `eosinophils` DECIMAL(8,2) NULL,
  `basophils` DECIMAL(8,2) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (name) VALUES ('admin') ON DUPLICATE KEY UPDATE name = name;
-- To create admin user, hash password with bcrypt and insert into users table.


ALTER TABLE users ADD COLUMN role_id INT NOT NULL;
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id);


CREATE TABLE BloodGroups (
  id INT AUTO_INCREMENT PRIMARY KEY,        -- Auto-incrementing primary key
  invoice_id INT NOT NULL,                  -- invoice_id column, cannot be NULL
  blood_group VARCHAR(255) NOT NULL,         -- blood_group column
  rh_factor ENUM('+', '-') NOT NULL,        -- rh_factor column with 'positive' or 'negative' values
  remarks TEXT,                             -- remarks column, optional
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- created_at timestamp
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- updated_at timestamp, updates automatically
  FOREIGN KEY (invoice_id) REFERENCES Invoices(id)  -- Optional: foreign key reference to Invoices table if needed
);


CREATE TABLE Btct (
  id INT AUTO_INCREMENT PRIMARY KEY,           -- Auto-incrementing primary key
  invoice_id INT NOT NULL,                     -- invoice_id to link to the Invoices table
  bleeding_time DECIMAL(10, 2),                -- bleeding_time (optional, in minutes or seconds)
  clotting_time DECIMAL(10, 2),                -- clotting_time (optional, in minutes)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp for record creation
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Timestamp for record update
  FOREIGN KEY (invoice_id) REFERENCES Invoices(id)  -- Foreign key linking to Invoices table (optional)
);


CREATE TABLE CbcPbf (
  id INT AUTO_INCREMENT PRIMARY KEY,            -- Auto-incrementing primary key
  invoice_id INT NOT NULL,                      -- Foreign key to link the result to an invoice
  hemoglobin DECIMAL(10, 2),                    -- Optional: Hemoglobin level (minimum 0, decimal values)
  rbc DECIMAL(10, 2),                           -- Optional: RBC count (minimum 0)
  wbc DECIMAL(10, 2),                           -- Optional: WBC count (minimum 0)
  platelet DECIMAL(10, 2),                      -- Optional: Platelet count (minimum 0)
  neutrophils DECIMAL(10, 2),                   -- Optional: Neutrophil count (minimum 0)
  lymphocytes DECIMAL(10, 2),                   -- Optional: Lymphocyte count (minimum 0)
  monocytes DECIMAL(10, 2),                     -- Optional: Monocyte count (minimum 0)
  eosinophils DECIMAL(10, 2),                   -- Optional: Eosinophil count (minimum 0)
  basophils DECIMAL(10, 2),                     -- Optional: Basophil count (minimum 0)
  pbf_findings TEXT,                            -- Optional: Peripheral Blood Film findings (text field)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Automatically set creation time
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Automatically set update time
  FOREIGN KEY (invoice_id) REFERENCES Invoices(id)  -- Foreign key to link to Invoices table
);



CREATE TABLE Hcg (
  id INT AUTO_INCREMENT PRIMARY KEY,            -- Auto-incrementing primary key
  invoice_id INT NOT NULL,                      -- Foreign key to link the result to an invoice
  test_date DATE NOT NULL,                      -- Date field for the test date (or you can use DATETIME)
  hcg_level DECIMAL(10, 2) NOT NULL,            -- HCG level (numeric value)
  result ENUM('Positive', 'Negative', 'Borderline') NOT NULL,  -- ENUM field for the result
  remarks TEXT,                                 -- Optional remarks field (can hold longer text)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Timestamp for record update
  FOREIGN KEY (invoice_id) REFERENCES Invoices(id)  -- Foreign key to reference the Invoices table
);


CREATE TABLE LipidProfile (
  id INT AUTO_INCREMENT PRIMARY KEY,               -- Auto-incrementing primary key
  invoice_id INT NOT NULL,                         -- Foreign key to link the result to an invoice
  total_cholesterol DECIMAL(10, 2),                -- Optional: Total cholesterol level (numeric value)
  hdl DECIMAL(10, 2),                              -- Optional: HDL cholesterol level
  ldl DECIMAL(10, 2),                              -- Optional: LDL cholesterol level
  triglycerides DECIMAL(10, 2),                    -- Optional: Triglycerides level
  vldl DECIMAL(10, 2),                             -- Optional: VLDL cholesterol level
  cholesterol_ratio DECIMAL(10, 2),                -- Optional: Cholesterol ratio (total cholesterol / HDL ratio)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Automatically set creation time
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Automatically set update time
  FOREIGN KEY (invoice_id) REFERENCES Invoices(id) -- Foreign key to reference the Invoices table
);
