import { NormalizedStudentData, NormalizationResult, PvNormalizerPlugin, NormalizationError } from '../types/pv-normalization.types';
import { XMLParser } from 'fast-xml-parser';
import { parseAndNormalizeGrade } from '../utils/grade-normalization.utils';

export abstract class BaseNormalizerPlugin implements PvNormalizerPlugin {
    abstract universityName: string;
    protected parser: XMLParser;

    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            isArray: (name) => this.getArrayTags().includes(name)
        });
    }

    /**
     * Returns an array of XML tag names that should be treated as arrays
     * Override this method in derived classes to customize for different XML formats
     */
    protected getArrayTags(): string[] {
        return []; // Default empty list - must be overridden by specific implementations
    }

    abstract canNormalize(xmlContent: string): boolean;

    async normalize(xmlContent: string): Promise<NormalizationResult> {
        try {
            const parsedXml = this.parser.parse(xmlContent);

            if (!this.isValidXmlStructure(parsedXml)) {
                return {
                    success: false,
                    errorMessage: NormalizationError.INVALID_XML
                };
            }

            const normalizedData = this.extractStudentData(parsedXml);

            if (normalizedData.length === 0) {
                return {
                    success: false,
                    errorMessage: NormalizationError.MISSING_REQUIRED_FIELDS
                };
            }

            return {
                success: true,
                data: normalizedData
            };
        } catch (error) {
            console.error(`Error normalizing PV file: ${error}`);
            return {
                success: false,
                errorMessage: `${NormalizationError.PARSING_ERROR}: ${error}`
            };
        }
    }

    /**
     * Normalizes a grade value using the shared grade normalization utility
     * @param gradeValue Raw grade value from XML
     * @returns Normalized grade on 0-20 scale or null
     */
    protected normalizeGradeValue(gradeValue: string | number): number | null {
        return parseAndNormalizeGrade(gradeValue);
    }

    protected abstract isValidXmlStructure(parsedXml: any): boolean;

    protected abstract extractStudentData(parsedXml: any): NormalizedStudentData[];
}
