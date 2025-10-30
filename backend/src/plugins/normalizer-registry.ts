import { PvNormalizerPlugin } from '../types/pv-normalization.types';
import { BordeauxUniversityNormalizer } from './universities/bordeaux-university-normalizer.plugin';

export class NormalizerRegistry {
    private static plugins: PvNormalizerPlugin[] = [];

    public static initialize() {
        // Register all available normalizer plugins
        this.registerPlugin(new BordeauxUniversityNormalizer());

        // Additional plugins would be registered here
        // this.registerPlugin(new ParisUniversityNormalizer());
        // this.registerPlugin(new LyonUniversityNormalizer());
    }

    public static registerPlugin(plugin: PvNormalizerPlugin) {
        this.plugins.push(plugin);
    }

    public static findSuitableNormalizer(xmlContent: string): PvNormalizerPlugin | null {
        for (const plugin of this.plugins) {
            if (plugin.canNormalize(xmlContent)) {
                return plugin;
            }
        }
        return null;
    }

    public static getAllPlugins(): PvNormalizerPlugin[] {
        return [...this.plugins];
    }
}
