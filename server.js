const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'foxmap'
}).promise()

const locations = ['RedRiver', 'Ashtown', 'Sableport', 'TheHeartlands', 'Origin']

app.get('/all', async (req, res) => {
    try {
        const results = {}
        
        for (const location of locations) {
            const [rows] = await db.query(`SELECT id, city, point_name, status, updated_at FROM ??`, [location])
            results[location] = rows
        }
        
        res.json({
            data: results
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

app.get('/:location', async (req, res) => {
    const { location } = req.params
    
    if (!locations.includes(location)) {
        return res.status(400).json({ success: false, error: 'Invalid location' })
    }
    
    try {
        const [rows] = await db.query(`SELECT id, city, point_name, status, updated_at FROM ??`, [location])
        res.json({
            location: location,
            data: rows
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

app.post('/:location/:city/toggle', async (req, res) => {
    const { location, city } = req.params
    
    if (!locations.includes(location)) {
        return res.status(400).json({ success: false, error: 'Invalid location' })
    }
    
    try {
        const [current] = await db.query(`SELECT status FROM ?? WHERE city = ?`, [location, city])
        
        if (current.length === 0) {
            return res.status(404).json({ success: false, error: 'Point not found' })
        }
        
        const newStatus = !current[0].status
        
        await db.query(`UPDATE ?? SET status = ? WHERE city = ?`, [location, newStatus, city])
        
        const [updated] = await db.query(`SELECT id, city, point_name, status, updated_at FROM ?? WHERE city = ?`, [location, city])
        
        res.json({
            point: updated[0]
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
})