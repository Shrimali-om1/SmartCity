export const AMC_ZONES = {
    'Central': ['Jamalpur', 'Khadia', 'Shahpur', 'Dariapur', 'Kalupur', 'Lal Darwaja', 'Astodia', 'Gheekanta'],
    'West': ['Navrangpura', 'Naranpura', 'Paldi', 'Vasna', 'Ambawadi', 'Ranip', 'Vadaj', 'University', 'CG Road', 'Ashram Road', 'Income Tax', 'Usmanpura'],
    'North West': ['Bodakdev', 'Thaltej', 'Sola', 'Gota', 'Ghatlodiya', 'Chandlodiya', 'Science City', 'Hebatpur', 'Shilaj'],
    'South West': ['Satellite', 'Jodhpur', 'Prahladnagar', 'Sarkhej', 'Vejalpur', 'Maktampura', 'Bakeri City', 'South Bopal'],
    'North': ['Naroda', 'Memco', 'Saraspur', 'Sardarnagar', 'Shahibaug'],
    'South': ['Maninagar', 'Danilimda', 'Isanpur', 'Vatva', 'Ghodasar'],
    'East': ['Nikol', 'Viratnagar', 'Bapunagar', 'Gomtipur', 'Odhav']
};

export function identifyAMCZone(addressObject) {
    if (!addressObject) return 'Unknown';

    // The subregion, district, or name might contain the ward/locality name
    // We check various fields returned by reverseGeocodeAsync
    const fieldsToCheck = [
        addressObject.subregion,
        addressObject.district,
        addressObject.city,
        addressObject.name,
        addressObject.street
    ];

    for (const field of fieldsToCheck) {
        if (!field) continue;

        const normalizedField = field.toLowerCase();

        for (const [zone, areas] of Object.entries(AMC_ZONES)) {
            for (const area of areas) {
                if (normalizedField.includes(area.toLowerCase())) {
                    return zone;
                }
            }
        }
    }

    return 'Unknown';
}
