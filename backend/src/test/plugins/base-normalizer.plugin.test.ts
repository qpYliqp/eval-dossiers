import { BaseNormalizerPlugin } from '../../plugins/base-normalizer.plugin';
import { NormalizedStudentData, NormalizationError } from '../../types/pv-normalization.types';
import { XMLParser } from 'fast-xml-parser';


jest.mock('fast-xml-parser');


class TestNormalizer extends BaseNormalizerPlugin {
    universityName = 'Test University';

    canNormalize(xmlContent: string): boolean {
        return xmlContent.includes('TestUniversity');
    }

    protected isValidXmlStructure(parsedXml: any): boolean {
        if (!parsedXml) return false;
        if (!parsedXml.TestUniversity) return false;
        if (!Array.isArray(parsedXml.TestUniversity.students)) return false;
        return true;
    }

    protected extractStudentData(parsedXml: any): NormalizedStudentData[] {
        if (!parsedXml || !parsedXml.TestUniversity || !parsedXml.TestUniversity.students) {
            return [];
        }

        return parsedXml.TestUniversity.students.map((student: any) => ({
            name: student.name,
            dateOfBirth: student.dob,
            studentNumber: student.id,
            semesterResults: student.results.map((result: any) => ({
                semesterName: result.semester,
                grade: result.grade
            }))
        }));
    }

    protected getArrayTags(): string[] {
        return ['students', 'results'];
    }
}

describe('BaseNormalizerPlugin', () => {
    let normalizer: TestNormalizer;
    let mockedXmlParser: jest.Mocked<XMLParser>;


    const validXmlContent = '<xml>TestUniversity content</xml>';
    const invalidXmlContent = '<xml>Other university content</xml>';
    const mockParsedValidXml = {
        TestUniversity: {
            students: [
                {
                    name: 'John Doe',
                    dob: '19950515',
                    id: '12345',
                    results: [
                        { semester: 'Fall 2020', grade: 15.5 },
                        { semester: 'Spring 2021', grade: 16.0 }
                    ]
                },
                {
                    name: 'Jane Smith',
                    dob: '19960620',
                    id: '67890',
                    results: [
                        { semester: 'Fall 2020', grade: 14.0 }
                    ]
                }
            ]
        }
    };

    const mockParsedInvalidXml = {
        OtherUniversity: { students: [] }
    };

    const mockParsedEmptyXml = {
        TestUniversity: { students: [] }
    };

    beforeEach(() => {
        jest.clearAllMocks();


        (XMLParser as jest.Mock).mockImplementation(() => {
            return {
                parse: jest.fn((xmlContent) => {
                    if (xmlContent === validXmlContent) return mockParsedValidXml;
                    if (xmlContent === invalidXmlContent) return mockParsedInvalidXml;
                    if (xmlContent === 'empty') return mockParsedEmptyXml;
                    if (xmlContent === 'error') throw new Error('XML parsing error');
                    return null;
                })
            };
        });

        normalizer = new TestNormalizer();
        mockedXmlParser = (normalizer as any).parser;
    });

    describe('constructor', () => {
        it('devrait initialiser XMLParser avec les options correctes', () => {
            expect(XMLParser).toHaveBeenCalled();
            expect(mockedXmlParser).toBeDefined();
        });
    });

    describe('getArrayTags', () => {
        it('devrait retourner les balises de tableau', () => {
            const tags = (normalizer as any).getArrayTags();
            expect(tags).toEqual(['students', 'results']);
        });

        it('devrait retourner un tableau vide par défaut dans la classe de base', () => {

            class MinimalNormalizer extends BaseNormalizerPlugin {
                universityName = 'Minimal University';
                canNormalize = jest.fn().mockReturnValue(true);
                protected isValidXmlStructure = jest.fn().mockReturnValue(true);
                protected extractStudentData = jest.fn().mockReturnValue([]);
            }

            const minimalNormalizer = new MinimalNormalizer();

            const tags = (minimalNormalizer as any).getArrayTags();
            expect(tags).toEqual([]);
        });
    });

    describe('canNormalize', () => {
        it('devrait retourner vrai pour un contenu valide', () => {
            expect(normalizer.canNormalize(validXmlContent)).toBe(true);
        });

        it('devrait retourner faux pour un contenu invalide', () => {
            expect(normalizer.canNormalize(invalidXmlContent)).toBe(false);
        });
    });

    describe('normalize', () => {
        it('devrait normaliser avec succès un contenu XML valide', async () => {
            const result = await normalizer.normalize(validXmlContent);

            expect(result).toEqual({
                success: true,
                data: [
                    {
                        name: 'John Doe',
                        dateOfBirth: '19950515',
                        studentNumber: '12345',
                        semesterResults: [
                            { semesterName: 'Fall 2020', grade: 15.5 },
                            { semesterName: 'Spring 2021', grade: 16.0 }
                        ]
                    },
                    {
                        name: 'Jane Smith',
                        dateOfBirth: '19960620',
                        studentNumber: '67890',
                        semesterResults: [
                            { semesterName: 'Fall 2020', grade: 14.0 }
                        ]
                    }
                ]
            });

            expect(mockedXmlParser.parse).toHaveBeenCalledWith(validXmlContent);
        });

        it('devrait retourner une erreur pour une structure XML invalide', async () => {
            const result = await normalizer.normalize(invalidXmlContent);

            expect(result).toEqual({
                success: false,
                errorMessage: NormalizationError.INVALID_XML
            });
        });

        it('devrait retourner une erreur lorsqu\'aucun étudiant n\'est trouvé', async () => {
            const result = await normalizer.normalize('empty');

            expect(result).toEqual({
                success: false,
                errorMessage: NormalizationError.MISSING_REQUIRED_FIELDS
            });
        });

        it('devrait gérer les erreurs d\'analyse', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await normalizer.normalize('error');

            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain(NormalizationError.PARSING_ERROR);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('isValidXmlStructure', () => {
        it('devrait retourner vrai pour une structure valide', () => {
            const result = (normalizer as any).isValidXmlStructure(mockParsedValidXml);
            expect(result).toBe(true);
        });

        it('devrait retourner faux pour une structure invalide', () => {
            const result = (normalizer as any).isValidXmlStructure(mockParsedInvalidXml);
            expect(result).toBe(false);
        });

        it('devrait retourner faux pour null ou indéfini', () => {
            expect((normalizer as any).isValidXmlStructure(null)).toBe(false);
            expect((normalizer as any).isValidXmlStructure(undefined)).toBe(false);
        });
    });

    describe('extractStudentData', () => {
        it('devrait extraire les données d\'un XML analysé valide', () => {
            const result = (normalizer as any).extractStudentData(mockParsedValidXml);

            expect(result).toEqual([
                {
                    name: 'John Doe',
                    dateOfBirth: '19950515',
                    studentNumber: '12345',
                    semesterResults: [
                        { semesterName: 'Fall 2020', grade: 15.5 },
                        { semesterName: 'Spring 2021', grade: 16.0 }
                    ]
                },
                {
                    name: 'Jane Smith',
                    dateOfBirth: '19960620',
                    studentNumber: '67890',
                    semesterResults: [
                        { semesterName: 'Fall 2020', grade: 14.0 }
                    ]
                }
            ]);
        });

        it('devrait retourner un tableau vide pour un XML analysé invalide', () => {
            const result = (normalizer as any).extractStudentData(mockParsedInvalidXml);
            expect(result).toEqual([]);
        });

        it('devrait retourner un tableau vide pour un XML analysé vide', () => {
            const result = (normalizer as any).extractStudentData(mockParsedEmptyXml);
            expect(result).toEqual([]);
        });

        it('devrait retourner un tableau vide pour null ou indéfini', () => {
            expect((normalizer as any).extractStudentData(null)).toEqual([]);
            expect((normalizer as any).extractStudentData(undefined)).toEqual([]);
        });
    });
});
