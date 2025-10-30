import { NormalizerRegistry } from '../../plugins/normalizer-registry';
import { BordeauxUniversityNormalizer } from '../../plugins/universities/bordeaux-university-normalizer.plugin';
import { PvNormalizerPlugin, NormalizationResult } from '../../types/pv-normalization.types';


jest.mock('../../plugins/universities/bordeaux-university-normalizer.plugin');

describe('NormalizerRegistry', () => {

    let mockBordeauxNormalizer: jest.Mocked<PvNormalizerPlugin>;
    let mockParisNormalizer: jest.Mocked<PvNormalizerPlugin>;
    let mockLyonNormalizer: jest.Mocked<PvNormalizerPlugin>;


    beforeEach(() => {
        jest.clearAllMocks();


        (NormalizerRegistry as any).plugins = [];


        mockBordeauxNormalizer = {
            universityName: 'University of Bordeaux',
            canNormalize: jest.fn(),
            normalize: jest.fn()
        };


        mockParisNormalizer = {
            universityName: 'University of Paris',
            canNormalize: jest.fn(),
            normalize: jest.fn()
        };


        mockLyonNormalizer = {
            universityName: 'University of Lyon',
            canNormalize: jest.fn(),
            normalize: jest.fn()
        };


        (BordeauxUniversityNormalizer as jest.Mock).mockImplementation(() => mockBordeauxNormalizer);
    });

    describe('initialize', () => {
        it('devrait enregistrer le normaliseur de l\'Université de Bordeaux', () => {

            const registerPluginSpy = jest.spyOn(NormalizerRegistry, 'registerPlugin');


            NormalizerRegistry.initialize();


            expect(BordeauxUniversityNormalizer).toHaveBeenCalledTimes(1);


            expect(registerPluginSpy).toHaveBeenCalledWith(mockBordeauxNormalizer);
        });
    });

    describe('registerPlugin', () => {
        it('devrait ajouter un plugin au registre', () => {

            NormalizerRegistry.registerPlugin(mockParisNormalizer);


            const plugins = NormalizerRegistry.getAllPlugins();
            expect(plugins).toContain(mockParisNormalizer);
            expect(plugins).toHaveLength(1);
        });

        it('devrait permettre d\'enregistrer plusieurs plugins', () => {

            NormalizerRegistry.registerPlugin(mockBordeauxNormalizer);
            NormalizerRegistry.registerPlugin(mockParisNormalizer);
            NormalizerRegistry.registerPlugin(mockLyonNormalizer);


            const plugins = NormalizerRegistry.getAllPlugins();


            expect(plugins).toHaveLength(3);
            expect(plugins).toContain(mockBordeauxNormalizer);
            expect(plugins).toContain(mockParisNormalizer);
            expect(plugins).toContain(mockLyonNormalizer);
        });
    });

    describe('findSuitableNormalizer', () => {
        it('devrait retourner un normaliseur qui peut gérer le contenu XML', () => {

            const bordeauxXml = '<xml>EREPVR10</xml>';
            const parisXml = '<xml>PARIS_UNIV</xml>';


            NormalizerRegistry.registerPlugin(mockBordeauxNormalizer);
            NormalizerRegistry.registerPlugin(mockParisNormalizer);


            mockBordeauxNormalizer.canNormalize.mockImplementation(
                (content) => content.includes('EREPVR10')
            );
            mockParisNormalizer.canNormalize.mockImplementation(
                (content) => content.includes('PARIS_UNIV')
            );


            const bordeauxNormalizer = NormalizerRegistry.findSuitableNormalizer(bordeauxXml);
            expect(bordeauxNormalizer).toBe(mockBordeauxNormalizer);
            expect(mockBordeauxNormalizer.canNormalize).toHaveBeenCalledWith(bordeauxXml);


            const parisNormalizer = NormalizerRegistry.findSuitableNormalizer(parisXml);
            expect(parisNormalizer).toBe(mockParisNormalizer);
            expect(mockParisNormalizer.canNormalize).toHaveBeenCalledWith(parisXml);
        });

        it('devrait retourner null si aucun normaliseur approprié n\'est trouvé', () => {

            const unknownXml = '<xml>UNKNOWN_UNIVERSITY</xml>';


            NormalizerRegistry.registerPlugin(mockBordeauxNormalizer);


            mockBordeauxNormalizer.canNormalize.mockReturnValue(false);


            const normalizer = NormalizerRegistry.findSuitableNormalizer(unknownXml);
            expect(normalizer).toBeNull();
            expect(mockBordeauxNormalizer.canNormalize).toHaveBeenCalledWith(unknownXml);
        });

        it('devrait retourner le premier normaliseur approprié si plusieurs correspondent', () => {

            const ambiguousXml = '<xml>COMMON_FORMAT</xml>';


            NormalizerRegistry.registerPlugin(mockBordeauxNormalizer);
            NormalizerRegistry.registerPlugin(mockParisNormalizer);


            mockBordeauxNormalizer.canNormalize.mockReturnValue(true);
            mockParisNormalizer.canNormalize.mockReturnValue(true);


            const normalizer = NormalizerRegistry.findSuitableNormalizer(ambiguousXml);


            expect(normalizer).toBe(mockBordeauxNormalizer);
            expect(mockParisNormalizer.canNormalize).not.toHaveBeenCalled();
        });
    });

    describe('getAllPlugins', () => {
        it('devrait retourner tous les plugins enregistrés', () => {

            NormalizerRegistry.registerPlugin(mockBordeauxNormalizer);
            NormalizerRegistry.registerPlugin(mockParisNormalizer);


            const plugins = NormalizerRegistry.getAllPlugins();


            expect(plugins).toHaveLength(2);
            expect(plugins).toContain(mockBordeauxNormalizer);
            expect(plugins).toContain(mockParisNormalizer);
        });

        it('devrait retourner un tableau vide si aucun plugin n\'est enregistré', () => {

            const plugins = NormalizerRegistry.getAllPlugins();


            expect(plugins).toHaveLength(0);
        });

        it('devrait retourner un nouveau tableau (pas la référence interne)', () => {

            NormalizerRegistry.registerPlugin(mockBordeauxNormalizer);


            const plugins = NormalizerRegistry.getAllPlugins();


            plugins.push(mockParisNormalizer);


            const pluginsAgain = NormalizerRegistry.getAllPlugins();


            expect(pluginsAgain).toHaveLength(1);
            expect(pluginsAgain).not.toContain(mockParisNormalizer);
        });
    });

    describe('integration', () => {
        it('devrait fonctionner avec le flux complet d\'initialisation et de normalisation', async () => {

            NormalizerRegistry.initialize();


            mockBordeauxNormalizer.canNormalize.mockReturnValue(true);
            mockBordeauxNormalizer.normalize.mockResolvedValue({
                success: true,
                data: [{
                    name: 'Test Student',
                    dateOfBirth: '19950101',
                    studentNumber: '12345',
                    semesterResults: [{ semesterName: 'Spring 2023', grade: 15.0 }]
                }]
            });


            const normalizer = NormalizerRegistry.findSuitableNormalizer('<xml>test</xml>');
            expect(normalizer).not.toBeNull();

            if (normalizer) {

                const result = await normalizer.normalize('<xml>test</xml>');
                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data?.length).toBe(1);
                expect(result.data?.[0].name).toBe('Test Student');
            }
        });
    });
});
