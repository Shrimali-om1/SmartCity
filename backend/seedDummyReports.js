require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./models/Report');
const User = require('./models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartcity';

const dummyReports = [
    {
        title: 'Massive Pothole on CG Road',
        description: 'Large pothole causing traffic slowdowns and potential vehicle damage.',
        category: 'Road',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
        afterImage: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&q=80',
        location: { latitude: 23.0338, longitude: 72.5621, locality: 'CG Road', zone: 'West' },
        status: 'closed',
        materialsUsed: '2 tons asphalt',
        laborHours: 5,
        rating: 5,
        completionTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
        title: 'Broken Streetlight near SG Highway',
        description: 'Pitch black intersection, very dangerous at night.',
        category: 'Electricity',
        imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80',
        location: { latitude: 23.0038, longitude: 72.5021, locality: 'SG Highway', zone: 'North West' },
        status: 'pending',
    },
    {
        title: 'Overflowing Garbage Bins',
        description: 'Garbage hasn\'t been collected for 3 days.',
        category: 'Waste',
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80',
        afterImage: 'https://images.unsplash.com/photo-1611284446314-60a5840ce350?auto=format&fit=crop&q=80',
        location: { latitude: 23.0225, longitude: 72.5714, locality: 'Ellisbridge', zone: 'West' },
        status: 'resolved',
        materialsUsed: 'None',
        laborHours: 1,
        completionTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
        title: 'Water Pipe Burst at Maninagar',
        description: 'Thousands of liters of water wasting away on the main road.',
        category: 'Water',
        imageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80',
        location: { latitude: 22.9978, longitude: 72.6021, locality: 'Maninagar', zone: 'South' },
        status: 'assigned',
    },
    {
        title: 'Fallen Tree Blocking Driveway',
        description: 'A large tree fell during last night\'s storm.',
        category: 'Other',
        imageUrl: 'https://images.unsplash.com/photo-1563806282834-315ec0904a43?auto=format&fit=crop&q=80',
        afterImage: 'https://images.unsplash.com/photo-1582216592233-a309e4bd824d?auto=format&fit=crop&q=80',
        location: { latitude: 23.0538, longitude: 72.5321, locality: 'Vastrapur', zone: 'North West' },
        status: 'closed',
        materialsUsed: 'Chainsaw gas',
        laborHours: 3,
        rating: 4,
        completionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
        title: 'Dead Animal on Road',
        description: 'Needs immediate sanitation removal.',
        category: 'Waste',
        imageUrl: 'https://images.unsplash.com/photo-1596783049187-578d655f2d01?auto=format&fit=crop&q=80',
        location: { latitude: 23.0138, longitude: 72.5821, locality: 'Kankaria', zone: 'South' },
        status: 'pending',
    },
    {
        title: 'Traffic Light Malfunction',
        description: 'All 4 lights are blinking yellow.',
        category: 'Road',
        imageUrl: 'https://images.unsplash.com/photo-1510006263592-6927598858db?auto=format&fit=crop&q=80',
        location: { latitude: 23.0638, longitude: 72.6021, locality: 'Shahibaug', zone: 'North' },
        status: 'assigned_to_contractor',
    },
    {
        title: 'Pothole near Bopal bridge',
        description: 'Road cave in starting to form.',
        category: 'Road',
        imageUrl: 'https://images.unsplash.com/photo-1628148819586-77881bcdebac?auto=format&fit=crop&q=80',
        afterImage: 'https://images.unsplash.com/photo-1605330838337-b9f19db1d636?auto=format&fit=crop&q=80',
        location: { latitude: 23.0238, longitude: 72.4621, locality: 'Bopal', zone: 'South West' },
        status: 'completed_pending_review',
        materialsUsed: '1 ton gravel, cement',
        laborHours: 4,
        completionTime: new Date()
    }
];

const seedDummyData = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const tempCitizen = await User.findOne({ role: 'citizen' });
        const citizenId = tempCitizen ? tempCitizen._id : new mongoose.Types.ObjectId();

        console.log(`Using Citizen ID: ${citizenId}`);

        for (let data of dummyReports) {
            data.citizenId = citizenId;
            data.createdAt = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000); // Random within last 10 days
            if (!data.completionTime && (data.status === 'closed' || data.status === 'resolved')) {
                data.completionTime = new Date(data.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later
            }
            await Report.create(data);
            console.log(`Inserted dummy report: ${data.title}`);
        }

        console.log('Successfully seeded dummy reports!');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

seedDummyData();
