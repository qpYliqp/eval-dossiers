export interface GradeScale {
    min: number;
    max: number;
    scale: number;
}

export const GRADE_SCALES = {
    SCALE_0_20: {
        min: 0,
        max: 20,
        scale: 20
    },
    SCALE_0_200: {
        min: 0,
        max: 200,
        scale: 200
    }
};