import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    title: String,
    company: String,
    location: String,
    link: String,
    source: String,
    salary: String,
    tags: String,
    
    keyword: {
        type: String,
        required: true,
        index: true  
    },
    searchLocation: {
        type: String,
        required: true,
        index: true  
    },
    dateFetched: {
        type: Date,
        default: Date.now,
        index: true 
    }
});

jobSchema.index({ keyword: 1, searchLocation: 1, dateFetched: -1 });

jobSchema.index({ dateFetched: 1 }, { expireAfterSeconds: 604800 }); 
export default mongoose.model('Job', jobSchema);