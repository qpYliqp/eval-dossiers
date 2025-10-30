-- fixtures.sql

-- Suppression des tables existantes pour repartir sur une base propre
DROP TABLE IF EXISTS "CandidateScores";
DROP TABLE IF EXISTS "AcademicRecords";
DROP TABLE IF EXISTS "NormalizedCandidates";
DROP TABLE IF EXISTS "MappingEntries";
DROP TABLE IF EXISTS "MappingConfigurations";
DROP TABLE IF EXISTS "Files";
DROP TABLE IF EXISTS "MasterProgramSpaceExaminers";
DROP TABLE IF EXISTS "MasterProgramSpace";
DROP TABLE IF EXISTS "Users";

-- Création de la table "Users" avec la clé primaire "usersId"
CREATE TABLE "Users" (
    "usersId" SERIAL PRIMARY KEY,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE
);

-- Création de la table "MasterProgramSpace" avec la clé primaire "masterId"
CREATE TABLE "MasterProgramSpace" (
    "masterId" SERIAL PRIMARY KEY,
    "masterName" VARCHAR(255) NOT NULL,
    "academicUnit" VARCHAR(255) NOT NULL,
    "createdDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    CONSTRAINT fk_created_by FOREIGN KEY ("createdBy")
        REFERENCES "Users"("usersId")
        ON DELETE CASCADE
);

-- Table d'association pour la relation plusieurs-à-plusieurs entre "MasterProgramSpace" et les examinateurs
CREATE TABLE "MasterProgramSpaceExaminers" (
    "masterProgramMasterId" INTEGER NOT NULL,
    "examinerId" INTEGER NOT NULL,
    PRIMARY KEY ("masterProgramMasterId", "examinerId"),
    CONSTRAINT fk_space FOREIGN KEY ("masterProgramMasterId")
        REFERENCES "MasterProgramSpace"("masterId")
        ON DELETE CASCADE,
    CONSTRAINT fk_examiner FOREIGN KEY ("examinerId")
        REFERENCES "Users"("usersId")
        ON DELETE CASCADE
);

-- Création de la table "Files" (entité)
CREATE TABLE "Files" (
    "fileId" SERIAL PRIMARY KEY,
    "masterId" INTEGER NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileType" VARCHAR(50),
    "filePath" TEXT,  -- Chemin d'accès au fichier (anciennement fileUrl)
    "university" VARCHAR(255),   -- Université concernée
    "formation" VARCHAR(255),    -- Formation associée
    "yearAcademic" VARCHAR(50),  -- Année académique (ex : 2024-2025)
    "fileOrigin" VARCHAR(50),    -- Origine du fichier
    "session" INTEGER CHECK ("session" IN (1, 2)),  -- Session: accepte uniquement 1 ou 2
    "uploadDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" INTEGER NOT NULL,
    CONSTRAINT fk_master_space FOREIGN KEY ("masterId")
        REFERENCES "MasterProgramSpace"("masterId")
        ON DELETE CASCADE,
    CONSTRAINT fk_uploaded_by FOREIGN KEY ("uploadedBy")
        REFERENCES "Users"("usersId")
        ON DELETE CASCADE
);

-- Table to store normalized student data from PV files
CREATE TABLE IF NOT EXISTS "NormalizedStudentData" (
    "studentDataId" SERIAL PRIMARY KEY,
    "pvFileId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "dateOfBirth" VARCHAR(50),
    "studentNumber" VARCHAR(50) NOT NULL,
    "processedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pv_file FOREIGN KEY ("pvFileId")
        REFERENCES "Files"("fileId")
        ON DELETE CASCADE
);

-- Table to store semester results for each student
CREATE TABLE IF NOT EXISTS "SemesterResults" (
    "resultId" SERIAL PRIMARY KEY,
    "studentDataId" INTEGER NOT NULL,
    "semesterName" VARCHAR(100) NOT NULL,
    "grade" NUMERIC(10,3) NOT NULL,
    CONSTRAINT fk_student_data FOREIGN KEY ("studentDataId")
        REFERENCES "NormalizedStudentData"("studentDataId")
        ON DELETE CASCADE
);

-- Création des tables pour les mappages
CREATE TABLE "MappingConfigurations" (
    "configurationId" SERIAL PRIMARY KEY,
    "monmasterFileId" INTEGER NOT NULL,
    "pvFileId" INTEGER NOT NULL,
    "createdDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_monmaster_file FOREIGN KEY ("monmasterFileId")
        REFERENCES "Files"("fileId")
        ON DELETE CASCADE,
    CONSTRAINT fk_pv_file FOREIGN KEY ("pvFileId")
        REFERENCES "Files"("fileId")
        ON DELETE CASCADE,
    CONSTRAINT uq_file_pair UNIQUE ("monmasterFileId", "pvFileId")
);

CREATE TABLE "MappingEntries" (
    "entryId" SERIAL PRIMARY KEY,
    "configurationId" INTEGER NOT NULL,
    "masterColumnIndex" INTEGER NOT NULL,
    "masterColumnName" VARCHAR(255) NOT NULL,
    "pvColumnIndex" INTEGER NOT NULL,
    "pvColumnName" VARCHAR(255) NOT NULL,
    CONSTRAINT fk_configuration FOREIGN KEY ("configurationId")
        REFERENCES "MappingConfigurations"("configurationId")
        ON DELETE CASCADE,
    CONSTRAINT uq_master_column_mapping UNIQUE ("configurationId", "masterColumnIndex"),
    CONSTRAINT uq_pv_column_mapping UNIQUE ("configurationId", "pvColumnIndex")
);

CREATE TABLE IF NOT EXISTS "NormalizedCandidates" (
    "candidateId" SERIAL PRIMARY KEY,
    "monmasterFileId" INTEGER NOT NULL,
    "lastName" VARCHAR(255),
    "firstName" VARCHAR(255),
    "fullName" VARCHAR(511),
    "candidateNumber" VARCHAR(100),
    "dateOfBirth" VARCHAR(50),
    "processedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_monmaster_file_candidates FOREIGN KEY ("monmasterFileId")
        REFERENCES "Files"("fileId")
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AcademicRecords" (
    "recordId" SERIAL PRIMARY KEY,
    "candidateId" INTEGER NOT NULL,
    "academicYear" VARCHAR(100),
    "programType" VARCHAR(510),
    "curriculumYear" VARCHAR(100),
    "specialization" VARCHAR(510),
    "coursePath" VARCHAR(510),
    "gradeSemester1" NUMERIC(10,3),
    "gradeSemester2" NUMERIC(10,3),
    "institution" VARCHAR(510),
    CONSTRAINT fk_candidate_academic FOREIGN KEY ("candidateId")
        REFERENCES "NormalizedCandidates"("candidateId")
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CandidateScores" (
    "scoreId" SERIAL PRIMARY KEY,
    "candidateId" INTEGER NOT NULL,
    "scoreLabel" VARCHAR(510) NOT NULL,
    "scoreValue" VARCHAR(255),
    CONSTRAINT fk_candidate_scores FOREIGN KEY ("candidateId")
        REFERENCES "NormalizedCandidates"("candidateId")
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "ColumnSelections" (
    "selectionId" SERIAL PRIMARY KEY,
    "fileId" INTEGER NOT NULL,
    "columnIndex" INTEGER NOT NULL,
    "columnName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("fileId") REFERENCES "Files"("fileId") ON DELETE CASCADE,
    UNIQUE("fileId", "columnIndex")
);

-- Tables for MonMaster normalized data
CREATE TABLE IF NOT EXISTS "NormalizedCandidates" (
    "candidateId" SERIAL PRIMARY KEY,
    "monmasterFileId" INTEGER NOT NULL,
    "lastName" VARCHAR(255),
    "firstName" VARCHAR(255),
    "fullName" VARCHAR(511),
    "candidateNumber" VARCHAR(100),
    "dateOfBirth" VARCHAR(50),
    "processedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_monmaster_file_candidates FOREIGN KEY ("monmasterFileId")
        REFERENCES "Files"("fileId")
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AcademicRecords" (
    "recordId" SERIAL PRIMARY KEY,
    "candidateId" INTEGER NOT NULL,
    "academicYear" VARCHAR(100),
    "programType" VARCHAR(500),
    "curriculumYear" VARCHAR(100),
    "specialization" VARCHAR(500),
    "coursePath" VARCHAR(500),
    "gradeSemester1" NUMERIC(10,3),
    "gradeSemester2" NUMERIC(10,3),
    "institution" VARCHAR(500),
    CONSTRAINT fk_candidate_academic FOREIGN KEY ("candidateId")
        REFERENCES "NormalizedCandidates"("candidateId")
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CandidateScores" (
    "scoreId" SERIAL PRIMARY KEY,
    "candidateId" INTEGER NOT NULL,
    "scoreLabel" VARCHAR(500) NOT NULL,
    "scoreValue" VARCHAR(500),
    CONSTRAINT fk_candidate_scores FOREIGN KEY ("candidateId")
        REFERENCES "NormalizedCandidates"("candidateId")
        ON DELETE CASCADE
);

-- Insertion de quelques utilisateurs
INSERT INTO "Users" ("firstName", "lastName", "email")
VALUES
    ('Sarah', 'Johnson', 's.johnson@university.edu'),
    ('Michael', 'Chen', 'm.chen@university.edu'),
    ('Emily', 'Williams', 'e.williams@university.edu'),
    ('Michael', 'Brown', 'm.brown@university.edu'),
    ('Emily', 'White', 'e.white@university.edu'),
    ('James', 'Wilson', 'j.wilson@university.edu');

-- Insertion de quelques "MasterProgramSpace" avec le créateur référencé par "usersId"
INSERT INTO "MasterProgramSpace" ("masterName", "academicUnit", "createdDate", "lastUpdated", "createdBy")
VALUES
    ('Computer Science and Engineering', 'F School of Computing', '2024-01-15', '2024-01-15', 1),
    ('Data Science and Analytics', 'F School of Information Systems', '2024-01-10', '2024-01-10', 2),
    ('Artificial Intelligence', 'F School of Computing', '2024-01-05', '2024-01-05', 3);

-- Insertion des associations entre espaces et examinateurs
INSERT INTO "MasterProgramSpaceExaminers" ("masterProgramMasterId", "examinerId")
VALUES
    (1, 1),  -- Sarah Johnson est examinateur pour 'Computer Science and Engineering'
    (1, 2),  -- Michael Chen
    (1, 3),  -- Emily Williams
    (2, 2),  -- Michael Chen pour 'Data Science and Analytics'
    (2, 4),  -- Michael Brown
    (3, 3),  -- Emily Williams pour 'Artificial Intelligence'
    (3, 5),  -- Emily White
    (3, 6);  -- James Wilson

-- Insertion des données dans la table "Files" 
INSERT INTO "Files" 
("masterId", "fileName", "fileType", "filePath", "university", "formation", "yearAcademic", "fileOrigin", "session", "uploadedBy")
VALUES
    (1, 'candidates_data.xls', 'XLS', 'http://example.com/uploads/candidates_data.xls', 
         'University of Bordeaux', 'Computer Science', '2024-2025', 'MonMaster', 1, 1),
    (2, 'exam_schedule.pdf', 'PDF', 'http://example.com/uploads/exam_schedule.pdf', 
         'University of Bordeaux', 'Data Science', '2024-2025', 'Exam', 2, 2),
    (3, 'program_overview.docx', 'DOCX', 'http://example.com/uploads/program_overview.docx', 
         'University of Bordeaux', 'Artificial Intelligence', '2024-2025', 'Overview', 1, 3),
    -- Ajout d'un fichier PV pour l'exemple
    (1, 'results_session1.xml', 'XML', 'http://example.com/uploads/results_session1.xml', 
         'University of Bordeaux', 'Computer Science', '2024-2025', 'PV', 1, 1);

-- Insertion d'une configuration de mapping
INSERT INTO "MappingConfigurations" ("monmasterFileId", "pvFileId", "createdDate", "updatedDate")
VALUES
    (1, 4, '2024-01-20', '2024-01-20');

-- Insertion d'entrées de mapping
INSERT INTO "MappingEntries" ("configurationId", "masterColumnIndex", "masterColumnName", "pvColumnIndex", "pvColumnName")
VALUES
    (1, 0, 'Prénom', 2, 'Prénom'),
    (1, 1, 'Nom', 1, 'Name'),
    (1, 2, 'NumEtudiant', 0, 'StudentID');

-- Tables for grade comparison service

-- Table for storing candidate matches (mock for external matching service)
CREATE TABLE IF NOT EXISTS "CandidateMatches" (
    "matchId" SERIAL PRIMARY KEY,
    "monmasterFileId" INTEGER NOT NULL,
    "pvFileId" INTEGER NOT NULL,
    "monmasterCandidateId" INTEGER NOT NULL,
    "pvStudentDataId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_monmaster_file_matches FOREIGN KEY ("monmasterFileId")
        REFERENCES "Files"("fileId")
        ON DELETE CASCADE,
    CONSTRAINT fk_pv_file_matches FOREIGN KEY ("pvFileId")
        REFERENCES "Files"("fileId")
        ON DELETE CASCADE,
    CONSTRAINT fk_monmaster_candidate FOREIGN KEY ("monmasterCandidateId")
        REFERENCES "NormalizedCandidates"("candidateId")
        ON DELETE CASCADE,
    CONSTRAINT fk_pv_student FOREIGN KEY ("pvStudentDataId")
        REFERENCES "NormalizedStudentData"("studentDataId")
        ON DELETE CASCADE,
    CONSTRAINT uq_candidate_match UNIQUE ("monmasterCandidateId", "pvStudentDataId")
);

-- Table for storing individual field comparisons
CREATE TABLE IF NOT EXISTS "ComparisonResults" (
    "resultId" SERIAL PRIMARY KEY,
    "matchId" INTEGER NOT NULL,
    "fieldName" VARCHAR(255) NOT NULL,
    "monmasterValue" VARCHAR(255),
    "pvValue" VARCHAR(255),
    "similarityScore" DECIMAL(5,4) NOT NULL CHECK ("similarityScore" BETWEEN 0 AND 1),
    "verificationStatus" VARCHAR(20) CHECK ("verificationStatus" IN ('fully_verified', 'partially_verified', 'fraud', 'cannot_verify')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidate_match FOREIGN KEY ("matchId")
        REFERENCES "CandidateMatches"("matchId")
        ON DELETE CASCADE
);

-- Table for storing comparison summaries
CREATE TABLE IF NOT EXISTS "ComparisonSummary" (
    "summaryId" SERIAL PRIMARY KEY,
    "matchId" INTEGER NOT NULL,
    "averageSimilarity" DECIMAL(5,4) NOT NULL CHECK ("averageSimilarity" BETWEEN 0 AND 1),
    "overallVerificationStatus" VARCHAR(20) CHECK ("overallVerificationStatus" IN ('fully_verified', 'partially_verified', 'fraud', 'cannot_verify')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidate_match_summary FOREIGN KEY ("matchId")
        REFERENCES "CandidateMatches"("matchId")
        ON DELETE CASCADE,
    CONSTRAINT uq_match_summary UNIQUE ("matchId")
);