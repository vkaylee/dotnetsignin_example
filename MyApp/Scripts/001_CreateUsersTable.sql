CREATE TABLE Users (
    Id UUID PRIMARY KEY,
    Email VARCHAR(255) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX idx_users_email ON Users (Email);
CREATE UNIQUE INDEX idx_users_id ON Users (Id);
