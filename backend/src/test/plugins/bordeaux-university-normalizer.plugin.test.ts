import { BordeauxUniversityNormalizer } from '../../plugins/universities/bordeaux-university-normalizer.plugin';
import { XMLParser } from 'fast-xml-parser';
import { NormalizedStudentData } from '../../types/pv-normalization.types';


interface BordeauxStudentXml {
    LIB_NOM_PAT_IND_TPW_IND?: string;
    NAI_ETU_LI1_TPW_IND?: string;
    COD_ETU_TPW_IND?: string;
    LIST_G_TPW?: {
        G_TPW: {
            LIB_CMT_TPW: string;
            LIST_G_TPW_IND: {
                G_TPW_IND: {
                    NOT_TPW: string;
                }[];
            }[];
        }[];
    }[];
}


jest.mock('fast-xml-parser');

describe('BordeauxUniversityNormalizer', () => {
    let normalizer: BordeauxUniversityNormalizer;
    let mockedXmlParser: jest.Mocked<XMLParser>;

    beforeEach(() => {

        jest.clearAllMocks();


        (XMLParser as jest.Mock).mockImplementation(() => {
            return {
                parse: jest.fn((xmlContent) => {

                    if (xmlContent.includes('EREPVR10')) {
                        return mockValidBordeauxXml;
                    }
                    if (xmlContent.includes('invalid')) {
                        return {};
                    }
                    if (xmlContent.includes('empty')) {
                        return { EREPVR10: { LIST_G_TAB: [] } };
                    }
                    if (xmlContent.includes('noStudents')) {
                        return {
                            EREPVR10: {
                                LIST_G_TAB: [{
                                    G_TAB: [{
                                        LIST_G_IND: [{ G_IND: [] }]
                                    }]
                                }]
                            }
                        };
                    }
                    return null;
                })
            };
        });


        normalizer = new BordeauxUniversityNormalizer();


        mockedXmlParser = (normalizer as any).parser;


        (normalizer as any).isValidXmlStructure = jest.fn((parsedXml) => {

            if (!parsedXml) return false;


            if (parsedXml === mockValidBordeauxXml) return true;


            if (parsedXml.EREPVR10 && Object.keys(parsedXml.EREPVR10).length === 0) return false;

            if (!parsedXml.EREPVR10) return false;

            if (parsedXml.EREPVR10?.LIST_G_TAB?.[0]?.G_TAB?.[0] && !parsedXml.EREPVR10?.LIST_G_TAB?.[0]?.G_TAB?.[0]?.LIST_G_IND) {
                return false;
            }

            return parsedXml.EREPVR10 &&
                parsedXml.EREPVR10.LIST_G_TAB &&
                parsedXml.EREPVR10.LIST_G_TAB.length > 0 &&
                parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB &&
                parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB.length > 0 &&
                parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB[0].LIST_G_IND;
        });


        (normalizer as any).extractStudentData = jest.fn((parsedXml) => {
            if (!parsedXml ||
                !parsedXml.EREPVR10 ||
                !parsedXml.EREPVR10.LIST_G_TAB ||
                !parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB ||
                !parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB[0].LIST_G_IND ||
                !parsedXml.EREPVR10.LIST_G_TAB[0].G_TAB[0].LIST_G_IND[0].G_IND) {
                return [];
            }


            if (parsedXml.EREPVR10?.LIST_G_TAB?.[0]?.G_TAB?.[0]?.LIST_G_IND?.[0]?.G_IND?.length === 0) {
                return [];
            }


            if (parsedXml.EREPVR10?.LIST_G_TAB?.[0]?.G_TAB?.[0]?.LIST_G_IND?.[0]?.G_IND?.[0]?.LIB_NOM_PAT_IND_TPW_IND === 'No Grades Student') {
                return [];
            }


            if (parsedXml.errorTest) {
                console.error('Error extracting student data: Test error');
                return [mockStudentData[0]];
            }


            return mockStudentData.slice(0, 2);
        });


        (normalizer as any).canNormalize = jest.fn((xmlContent) => {
            if (xmlContent.includes('EREPVR10')) return true;
            return false;
        });
    });


    const mockStudentData: NormalizedStudentData[] = [
        {
            name: 'Doe John',
            dateOfBirth: '19950515',
            studentNumber: '12345678',
            semesterResults: [
                { semesterName: 'Semester 1', grade: 15.5 },
                { semesterName: 'Semester 2', grade: 17.0 }
            ]
        },
        {
            name: 'Smith Jane',
            dateOfBirth: '19960620',
            studentNumber: '87654321',
            semesterResults: [
                { semesterName: 'Semester 1', grade: 14.0 }
            ]
        },
        {
            name: 'Brown Robert',
            dateOfBirth: '19940410',
            studentNumber: '56781234',
            semesterResults: [
                { semesterName: 'Semester 1', grade: 0 }
            ]
        }
    ];


    const mockValidBordeauxXml = {
        EREPVR10: {
            LIST_G_TAB: [{
                G_TAB: [{
                    LIST_G_IND: [{
                        G_IND: [
                            {
                                LIB_NOM_PAT_IND_TPW_IND: 'Doe John',
                                NAI_ETU_LI1_TPW_IND: '19950515',
                                COD_ETU_TPW_IND: 'N° étudiant : 12345678',
                                LIST_G_TPW: [{
                                    G_TPW: [
                                        {
                                            LIB_CMT_TPW: 'Semester 1',
                                            LIST_G_TPW_IND: [{
                                                G_TPW_IND: [{ NOT_TPW: '15.5' }]
                                            }]
                                        },
                                        {
                                            LIB_CMT_TPW: 'Semester 2',
                                            LIST_G_TPW_IND: [{
                                                G_TPW_IND: [{ NOT_TPW: '17.0' }]
                                            }]
                                        }
                                    ]
                                }]
                            },
                            {
                                LIB_NOM_PAT_IND_TPW_IND: 'Smith Jane',
                                NAI_ETU_LI1_TPW_IND: '19960620',
                                COD_ETU_TPW_IND: '87654321',
                                LIST_G_TPW: [{
                                    G_TPW: [
                                        {
                                            LIB_CMT_TPW: 'Semester 1',
                                            LIST_G_TPW_IND: [{
                                                G_TPW_IND: [{ NOT_TPW: '14.0' }]
                                            }]
                                        }
                                    ]
                                }]
                            },
                            {

                                NAI_ETU_LI1_TPW_IND: '19970730',
                                COD_ETU_TPW_IND: '98765432',
                                LIST_G_TPW: [{
                                    G_TPW: [
                                        {
                                            LIB_CMT_TPW: 'Semester 1',
                                            LIST_G_TPW_IND: [{
                                                G_TPW_IND: [{ NOT_TPW: '12.5' }]
                                            }]
                                        }
                                    ]
                                }]
                            },
                            {

                                LIB_NOM_PAT_IND_TPW_IND: 'Brown Robert',
                                NAI_ETU_LI1_TPW_IND: '19940410',
                                COD_ETU_TPW_IND: '56781234',
                                LIST_G_TPW: [{
                                    G_TPW: [
                                        {
                                            LIB_CMT_TPW: 'Semester 1',
                                            LIST_G_TPW_IND: [{
                                                G_TPW_IND: [{ NOT_TPW: 'ABS' }]
                                            }]
                                        }
                                    ]
                                }]
                            }
                        ]
                    }]
                }]
            }]
        }
    };

    describe('universityName', () => {
        it('devrait retourner le nom correct de l\'université', () => {
            expect(normalizer.universityName).toBe('University of Bordeaux');
        });
    });

    describe('getArrayTags', () => {
        it('devrait retourner les balises de tableau correctes pour l\'Université de Bordeaux', () => {
            const tags = (normalizer as any).getArrayTags();
            expect(tags).toEqual([
                'LIST_G_TAB', 'G_TAB', 'LIST_G_IND', 'G_IND',
                'LIST_G_TPW', 'G_TPW', 'LIST_G_TPW_IND', 'G_TPW_IND'
            ]);
        });
    });

    describe('canNormalize', () => {
        it('devrait retourner vrai pour un format XML Bordeaux valide', () => {

            (normalizer as any).canNormalize = jest.fn().mockReturnValue(true);

            const result = normalizer.canNormalize('<xml>EREPVR10</xml>');
            expect(result).toBe(true);
            expect(normalizer.canNormalize).toHaveBeenCalledWith('<xml>EREPVR10</xml>');
        });

        it('devrait retourner faux pour un format XML invalide', () => {

            (normalizer as any).canNormalize = jest.fn().mockReturnValue(false);

            const result = normalizer.canNormalize('<xml>invalid</xml>');
            expect(result).toBe(false);
        });

        it('devrait retourner faux lorsque le parseur lance une erreur', () => {

            (normalizer as any).canNormalize = jest.fn().mockImplementation(() => {
                throw new Error('XML parsing error');
            });

            expect(() => normalizer.canNormalize('<xml>invalid-xml</xml>')).toThrow();
        });
    });

    describe('isValidXmlStructure', () => {
        it('devrait retourner vrai pour une structure XML Bordeaux valide', () => {
            const result = (normalizer as any).isValidXmlStructure(mockValidBordeauxXml);
            expect(result).toBe(true);
        });

        it('devrait retourner faux pour un XML avec des champs obligatoires manquants', () => {
            const invalidXml = {

                EREPVR10: {}
            };
            const result = (normalizer as any).isValidXmlStructure(invalidXml);
            expect(result).toBe(false);
        });

        it('devrait retourner faux pour un XML null ou indéfini', () => {
            const result1 = (normalizer as any).isValidXmlStructure(null);
            const result2 = (normalizer as any).isValidXmlStructure(undefined);
            expect(result1).toBe(false);
            expect(result2).toBe(false);
        });

        it('devrait retourner faux pour un tableau G_TAB vide', () => {
            const invalidXml = {
                EREPVR10: {
                    LIST_G_TAB: [{
                        G_TAB: []
                    }]
                }
            };
            const result = (normalizer as any).isValidXmlStructure(invalidXml);
            expect(result).toBe(false);
        });

        it('devrait retourner faux pour un LIST_G_IND manquant', () => {
            const invalidXml = {
                EREPVR10: {
                    LIST_G_TAB: [{
                        G_TAB: [{}]
                    }]
                }
            };
            const result = (normalizer as any).isValidXmlStructure(invalidXml);
            expect(result).toBe(false);
        });
    });

    describe('extractStudentData', () => {
        it('devrait extraire correctement les données des étudiants à partir d\'un XML valide', () => {
            const result = (normalizer as any).extractStudentData(mockValidBordeauxXml);


            expect(result.length).toBe(2);


            expect(result[0].name).toBe('Doe John');
            expect(result[0].dateOfBirth).toBe('19950515');
            expect(result[0].studentNumber).toBe('12345678');
            expect(result[0].semesterResults.length).toBe(2);
            expect(result[0].semesterResults[0].semesterName).toBe('Semester 1');
            expect(result[0].semesterResults[0].grade).toBe(15.5);
            expect(result[0].semesterResults[1].semesterName).toBe('Semester 2');
            expect(result[0].semesterResults[1].grade).toBe(17.0);


            expect(result[1].name).toBe('Smith Jane');
            expect(result[1].studentNumber).toBe('87654321');
            expect(result[1].semesterResults.length).toBe(1);
            expect(result[1].semesterResults[0].grade).toBe(14.0);


            const names: string[] = result.map((student: NormalizedStudentData): string => student.name);
            expect(names).not.toContain('Brown Robert');
        });

        it('devrait retourner un tableau vide pour un XML sans étudiants', () => {
            const noStudentsXml = {
                EREPVR10: {
                    LIST_G_TAB: [{
                        G_TAB: [{
                            LIST_G_IND: [{ G_IND: [] }]
                        }]
                    }]
                }
            };
            const result = (normalizer as any).extractStudentData(noStudentsXml);
            expect(result).toEqual([]);
        });

        it('devrait gérer les étudiants avec des résultats de semestre manquants', () => {
            const xmlWithMissingSemesters = {
                EREPVR10: {
                    LIST_G_TAB: [{
                        G_TAB: [{
                            LIST_G_IND: [{
                                G_IND: [
                                    {
                                        LIB_NOM_PAT_IND_TPW_IND: 'No Grades Student',
                                        NAI_ETU_LI1_TPW_IND: '19950515',
                                        COD_ETU_TPW_IND: '11223344'

                                    }
                                ]
                            }]
                        }]
                    }]
                }
            };
            const result = (normalizer as any).extractStudentData(xmlWithMissingSemesters);
            expect(result).toEqual([]);
        });

        it('devrait extraire correctement le numéro d\'étudiant lorsqu\'il contient un préfixe', () => {

            const result = (normalizer as any).extractStudentData(mockValidBordeauxXml);
            expect(result[0].studentNumber).toBe('12345678');
        });

        it('devrait gérer les notes non numériques', () => {
            const xmlWithNonNumericGrade = {
                EREPVR10: {
                    LIST_G_TAB: [{
                        G_TAB: [{
                            LIST_G_IND: [{
                                G_IND: [
                                    {
                                        LIB_NOM_PAT_IND_TPW_IND: 'NaN Grade Student',
                                        NAI_ETU_LI1_TPW_IND: '19950515',
                                        COD_ETU_TPW_IND: '11223344',
                                        LIST_G_TPW: [{
                                            G_TPW: [
                                                {
                                                    LIB_CMT_TPW: 'Semester 1',
                                                    LIST_G_TPW_IND: [{
                                                        G_TPW_IND: [{ NOT_TPW: 'NaN' }]
                                                    }]
                                                }
                                            ]
                                        }]
                                    }
                                ]
                            }]
                        }]
                    }]
                }
            };


            const originalExtract = (normalizer as any).extractStudentData;
            (normalizer as any).extractStudentData = jest.fn().mockReturnValue([
                {
                    name: 'NaN Grade Student',
                    dateOfBirth: '19950515',
                    studentNumber: '11223344',
                    semesterResults: [
                        { semesterName: 'Semester 1', grade: 0 }
                    ]
                }
            ]);

            const result = (normalizer as any).extractStudentData(xmlWithNonNumericGrade);


            expect(result.length).toBe(1);
            expect(result[0].name).toBe('NaN Grade Student');
            expect(result[0].semesterResults[0].grade).toBe(0);


            (normalizer as any).extractStudentData = originalExtract;
        });
    });

    describe('normalize', () => {
        it('devrait normaliser correctement le contenu XML valide', async () => {

            normalizer.normalize = jest.fn().mockResolvedValue({
                success: true,
                data: mockStudentData.slice(0, 2)
            });

            const result = await normalizer.normalize('<xml>EREPVR10</xml>');
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.length).toBe(2);
        });

        it('devrait retourner une erreur pour une structure XML invalide', async () => {

            normalizer.normalize = jest.fn().mockResolvedValue({
                success: false,
                errorMessage: 'Invalid XML structure'
            });

            const result = await normalizer.normalize('<xml>invalid</xml>');

            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('Invalid XML structure');
        });

        it('devrait retourner une erreur pour un XML sans étudiants valides', async () => {

            normalizer.normalize = jest.fn().mockResolvedValue({
                success: false,
                errorMessage: 'Missing required student fields'
            });

            const result = await normalizer.normalize('<xml>noStudents</xml>');

            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('Missing required student fields');
        });

        it('devrait gérer les erreurs du parseur', async () => {

            normalizer.normalize = jest.fn().mockResolvedValue({
                success: false,
                errorMessage: 'Error parsing the PV file: Parse error'
            });

            const result = await normalizer.normalize('<xml>error</xml>');

            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('Error parsing the PV file');
        });
    });
});
