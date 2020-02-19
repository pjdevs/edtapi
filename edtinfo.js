const http = require('http')
const fs = require('fs')
const xml = require('xml2js')

const path = './edt.xml'
const url = 'http://edt-st.u-bordeaux.fr./etudiants/Licence23/Semestre2/g254415.xml'

const date = new Date()
let day = date.getDate()
let month = date.getMonth() + 1 //+1 is required
let hour = date.getHours()

function getCourseName(course) {
    let mat = course['resources']['module'].item.split(' ')
    mat.shift()

    return mat.join(' ')
}

function getCourseDate(course, result) {
    let hm = course['starttime'].split(':')
    let week = course['prettyweeks']
    let day = course['day']

    let d = []
    result['timetable']['span'].forEach(w => {
        if (w['title'] == week) {
            d = w['day'][parseInt(day)]['date'].split('/')
        } 
    })

    d = new Date(d[2], d[1], d[0])
    d.setHours(hm[0], hm[1])

    return d
}

function getStartTime(course) {
    let h = course['starttime'].split(':')
    return parseInt(h[0])*60+parseInt(h[1])
}

function getEndTime(course) {
    let h = course['endtime'].split(':')
    return parseInt(h[0])*60+parseInt(h[1])
}

function getCurrentTime() {
    return date.getHours()*60+date.getMinutes()
}

function getNextCourse(result) {
    let courses = result['timetable']['event']
    let todayCourses = []
    let takeFist = false

    if (hour >= 17) {
        takeFist = true
        day += 1
    }

    courses.forEach(course => {
        let courseDate = getCourseDate(course, result)

        if (courseDate.getDate() == day && courseDate.getMonth() == month) {
            todayCourses.push(course)
        }
    })

    if (takeFist) {
        return todayCourses[0]
    }
    else {
        todayCourses.forEach((course) => {
            if (getStartTime(course) < getCurrentTime() && getCurrentTime() < getEndTime(course)) {
                return course
            }
        })
    }
}

function read() {
    fs.readFile(path, (err, data) => {
        if (err) throw err

        let parser = xml.Parser({ explicitArray: false })
        parser.parseString(data, (err, result) => {
            if (err) throw err

        let course = getNextCourse(result)
        let date = getCourseDate(course, result)
        let phrase = 'Le prochain cours est ' + getCourseName(course) + ' à ' + date.getHours() + ' heures'
        if (date.getMinutes() != 0) {
            phrase += ' ' + date.getMinutes()
        }
        
        process.stdout.write(phrase + '\n')
        })
    })
}

if (!(fs.existsSync(path))) {
    http.get(url, res => {
        let data = ''

        res.on('data', chunck => {
            data += chunck
        })

        res.on('end', () => {
            fs.writeFileSync(path, data)
            read()
        })

        res.on('error', err => {
            throw err
        })
    })
}
else {
    read()
}
