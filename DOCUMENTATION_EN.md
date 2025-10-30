# MonMasterUB Documentation

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Key Features](#key-features)
  - [Master Program Spaces](#master-program-spaces)
  - [File Upload and Management](#file-upload-and-management)
  - [Data Mapping](#data-mapping)
  - [Candidate Validation](#candidate-validation)
  - [Data Updates](#data-updates)
- [User Guide](#user-guide)
  - [Managing Master Programs](#managing-master-programs)
  - [Uploading Files](#uploading-files)
  - [Creating Data Mappings](#creating-data-mappings)
  - [Validating Candidates](#validating-candidates)
  - [Updating Candidate Information](#updating-candidate-information)
- [Troubleshooting](#troubleshooting)
- [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
- [Glossary](#glossary)

## Introduction

MonMasterUB is a comprehensive web application designed to streamline the management of master programs, student evaluations, and data verification processes for educational institutions. This application allows administrators and examiners to create and manage master program spaces, upload evaluation files, map data fields between different file formats, validate candidate information, and update student records efficiently.

The system helps bridge the gap between university-specific data (PV files) and standardized MonMaster formats, making evaluation processes more streamlined and accurate.

## Installation

### Using Docker (Recommended)

1. Ensure Docker and Docker Compose are installed on your system
2. Clone the repository:
   ```bash
   git clone https://gitlab.emi.u-bordeaux.fr/pfe2025/evaldossiers.git
   cd evaldossiers
   ```
3. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```
4. Access the application at `http://localhost:4200`


## Getting Started

After installation, follow these steps to get started with MonMasterUB:

1. **Access the Application**: Open your web browser and navigate to `http://localhost:4200`
2. **Create a Master Program Space**: Click on "Ajouter un espace" to create your first program space
3. **Upload Files**: Select your newly created master program and upload relevant MonMaster and PV files
4. **Map Data Fields**: Create mappings between MonMaster and university-specific data fields
5. **Validate Candidates**: Process and validate candidate information
6. **Review and Update Data**: Make any necessary updates to candidate information

## Key Features

### Master Program Spaces

The Master Program Spaces feature allows you to create and manage different program spaces for various master's degrees offered by your institution.

**Key Capabilities:**
- Create new master program spaces
- Manage existing master programs
- Add examiners to master programs
- View program details and statistics

### File Upload and Management

This feature enables you to upload and manage various file types associated with your master programs, primarily MonMaster and PV (university-specific) files.

**Supported File Types:**
- MonMaster formatted files
- University PV (Procès-Verbal) files
- Various document formats (XLSX, XML, PDF etc.)

### Data Mapping

The Data Mapping functionality allows you to create field mappings between MonMaster standardized formats and your institution's specific data formats (PV files).

**Benefits:**
- Create one-to-one field mappings
- Standardize data across different sources
- Save mapping configurations for reuse
- Reduce manual data entry errors

### Candidate Validation

The Candidate Validation feature helps you verify and validate candidate information across different data sources.

**Validation Levels:**
- Fully Verified: All candidate information matches across sources
- Partially Verified: Some information matches, but discrepancies exist
- Cannot Verify: Insufficient information to validate the candidate
- Potential Fraud: Significant discrepancies requiring investigation

### Data Updates

This feature allows you to view and update candidate information as needed.

**Update Capabilities:**
- Personal information (name, contact details)
- Academic records
- Scores and evaluations
- Supporting documentation

## User Guide

### Managing Master Programs

#### Creating a New Master Program
1. From the main dashboard, click "Ajouter un espace"
2. Fill in the required information:
   - Master Name (e.g., "Master Informatique")
   - Academic Unit (e.g., "UF Informatique")
3. Click "Submit" to create the master program

#### Adding Examiners (coming soon)
1. Select a master program from the dashboard
2. Click on "View Examiners" to see the current examiners
3. Click "Ajouter un examinateur" to add a new examiner
4. Select the examiner from the dropdown list
5. Click "Submit" to add the examiner

#### Managing Master Programs
- **Edit**: Click the edit icon on a master program card to modify its details
- **Delete**: Click the delete icon to remove a master program (confirmation required)
- **Navigate**: Use the context menu (three dots) to access specific features:
  - File System: Manage files for this master program
  - Mapping System: Create and manage data mappings
  - Data Verification: Validate candidate information

### Uploading Files

1. Navigate to the Files section for a specific master program
2. Choose the file type you wish to upload (MonMaster or PV)
3. Drag and drop your file or click to browse
4. Fill in the required metadata:
   - University Name
   - Academic Unit
   - Academic Year
   - Session (if applicable)
5. Click "Upload" to process the file

### Creating Data Mappings

1. Navigate to the Mapping section for a specific master program
2. If no files are selected, choose the relevant MonMaster and PV files
3. Once files are loaded, you will see three panels:
   - MonMaster Fields (left)
   - Current Mappings (center)
   - PV Fields (right)
4. To create a new mapping:
   - Click "Ajouter un mapping"
   - Select a field from the MonMaster list
   - Select a corresponding field from the PV list
   - Click "Enregistrer" to save the mapping
5. To delete a mapping, click the delete icon next to that mapping

### Validating Candidates

1. Navigate to the Validation section for a specific master program
2. Click "Commencer la validation" to start the validation process
3. The system will process and compare candidate data from different sources
4. Once complete, review the results in the table:
   - Green rows: Fully verified candidates
   - Yellow rows: Partially verified candidates
   - Red rows: Potential fraud cases
   - Blue rows: Cannot verify (insufficient information)
5. Use the filter option to show only verified candidates if needed
6. For detailed review:
   - Click the "Review" button to see detailed comparison
   - Click the "Edit" button to update candidate information

### Updating Candidate Information

1. Navigate to a candidate's update page (from the Validation section)
2. You will see:
   - Personal Information section
   - Academic Results section
   - Score Results section
   - Supporting documentation (PDF viewer)
3. To modify information:
   - Click on an editable field
   - Enter the new value
   - The system automatically saves changes when you click outside the field
4. Use the PDF viewer controls to:
   - Zoom in/out
   - Navigate between pages
   - Download or print the document

## Troubleshooting

### Common Issues and Solutions

#### Application Not Loading
- Ensure both frontend and backend servers are running
- Check if the correct ports (3000 for API, 4200 for frontend) are available
- Clear browser cache and refresh the page

#### File Upload Failures
- Verify the file is in a supported format
- Check file size (max 10MB recommended)
- Ensure all required metadata fields are completed
- Try uploading the file in smaller chunks if it's very large

#### Mapping Issues
- Ensure both MonMaster and PV files are successfully uploaded
- Check that column headers in the files are consistent and readable
- Clear any previous incomplete mapping attempts
- Restart the mapping process if encountering persistent errors

#### Validation Process Stalling
- The validation process can take several minutes for large datasets
- Ensure the system has completed all mapping operations before validation
- Check network connectivity and server response
- Refresh the page and restart the validation if necessary

#### Data Not Updating
- Verify you have the necessary permissions to edit the data
- Check if the fields are marked as editable
- Ensure the backend server is running and responsive
- Try refreshing the page and attempting the update again

## Frequently Asked Questions (FAQ)

### General Questions

**Q: What is MonMasterUB?**  
A: MonMasterUB is a web application designed to help educational institutions manage master programs, verify candidate information, and streamline the evaluation process.

### Technical Questions

**Q: Which browsers are supported?**  
A: MonMasterUB supports recent versions of Chrome, Firefox, Safari, and Edge.

**Q: Can I use the application on mobile devices?**  
A: While the application is primarily designed for desktop use, it has responsive design elements for tablet use. Smartphone use may be limited.

**Q: How do I report bugs or request features?**  
A: Please contact the system administrator or submit an issue through the project repository.

### Feature-Specific Questions

**Q: Can I reuse mappings across different master programs?**  
A: Currently, mappings are specific to file combinations. However, similar file structures will allow you to recreate mappings quickly.

**Q: What should I do if a candidate is flagged as potential fraud?**  
A: Review the detailed comparison data carefully. This may simply indicate a data entry error or mismatch that needs correction.

**Q: Can I export the validation results?**  
A: This feature is planned for a future update.

## Glossary

**MonMaster**: Standardized format for master program data management

**PV (Procès-Verbal)**: University-specific format for student evaluation and record-keeping

**Mapping**: The process of connecting fields between different data formats to enable comparison

**Validation**: The process of verifying candidate information across different data sources

**Academic Unit**: Department, faculty, or other organizational division within an educational institution

**Examiner**: Person responsible for reviewing and evaluating candidate applications or performance

**Field**: A specific data element within a file (e.g., name, score, date)

**Mapping Configuration**: Saved set of field mappings between specific file types
```