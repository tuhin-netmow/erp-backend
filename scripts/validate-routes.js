try {
    console.log('Validating production routes...');
    require('../src/modules/production/production.routes');
    console.log('✅ Production routes valid.');

    console.log('Validating raw-materials routes...');
    require('../src/modules/raw-materials/raw-materials.routes');
    console.log('✅ Raw Materials routes valid.');
} catch (error) {
    console.error('❌ Error loading routes:', error);
    process.exit(1);
}
