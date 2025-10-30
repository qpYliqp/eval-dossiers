import { BaseNormalizerPlugin } from '../base-normalizer.plugin';
import { NormalizedStudentData, SemesterResult } from '../../types/pv-normalization.types';

export class BordeauxUniversityNormalizer extends BaseNormalizerPlugin {
    universityName = 'University of Bordeaux';

    protected getArrayTags(): string[] {
        return ['LIST_G_TAB', 'G_TAB', 'LIST_G_IND', 'G_IND', 'LIST_G_TPW', 'G_TPW', 'LIST_G_TPW_IND', 'G_TPW_IND'];
    }

    canNormalize(xmlContent: string): boolean {
        // Check if the XML has the expected structure for Bordeaux University
        try {
            const parsedXml = this.parser.parse(xmlContent);
            return parsedXml && parsedXml.EREPVR10 &&
                parsedXml.EREPVR10.LIST_G_TAB &&
                parsedXml.EREPVR10.LIST_G_TAB.length > 0;
        } catch (error) {
            return false;
        }
    }

    protected isValidXmlStructure(parsedXml: any): boolean {
        return parsedXml &&
            parsedXml.EREPVR10 &&
            parsedXml.EREPVR10.LIST_G_TAB &&
            parsedXml.EREPVR10.LIST_G_TAB.length > 0 &&
            parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB &&
            parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB.length > 0 &&
            parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB[0].LIST_G_IND;
    }

    protected extractStudentData(parsedXml: any): NormalizedStudentData[] {
        const result: NormalizedStudentData[] = [];
        const students = parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB[0].LIST_G_IND[0].G_IND;

        if (!students || students.length === 0) {
            return result;
        }

        for (const student of students) {
            try {
                // Extract student basic information
                const name = student.LIB_NOM_PAT_IND_TPW_IND ? student.LIB_NOM_PAT_IND_TPW_IND.trim() : '';
                const dateOfBirth = student.NAI_ETU_LI1_TPW_IND ?
                    student.NAI_ETU_LI1_TPW_IND.replace(/-/g, '').trim() : '';

                let studentNumber = student.COD_ETU_TPW_IND || '';
                // Extract only the number from "N° étudiant : 22222222"
                if (studentNumber.includes(':')) {
                    studentNumber = studentNumber.split(':')[1].trim();
                }

                // Process the semester results
                const semesterResults: SemesterResult[] = [];
                if (student.LIST_G_TPW && student.LIST_G_TPW[0]?.G_TPW) {
                    for (const tpw of student.LIST_G_TPW[0].G_TPW) {
                        if (tpw.LIB_CMT_TPW && tpw.LIST_G_TPW_IND &&
                            tpw.LIST_G_TPW_IND[0]?.G_TPW_IND &&
                            tpw.LIST_G_TPW_IND[0].G_TPW_IND[0]?.NOT_TPW) {

                            const semesterName = tpw.LIB_CMT_TPW.trim();
                            const rawGrade = tpw.LIST_G_TPW_IND[0].G_TPW_IND[0].NOT_TPW;

                            // First convert to a float if possible
                            let gradeValue = parseFloat(rawGrade);
                            if (isNaN(gradeValue)) {
                                gradeValue = 0;
                            }

                            // Normalize the grade (but don't add a new field)
                            // Instead, store the normalized value directly
                            const normalizedGrade = this.normalizeGradeValue(rawGrade);

                            semesterResults.push({
                                semesterName,
                                grade: normalizedGrade !== null ? normalizedGrade : gradeValue
                            });
                        }
                    }
                }

                // Only add student if we have all required fields
                if (name && studentNumber && semesterResults.length > 0) {
                    result.push({
                        name,
                        dateOfBirth,
                        studentNumber,
                        semesterResults
                    });
                }
            } catch (error) {
                console.error(`Error extracting student data: ${error}`);
                continue; // Skip this student if there's an error
            }
        }

        return result;
    }
}
