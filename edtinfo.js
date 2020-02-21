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

function getStartTimeMinutes(course) {
    let h = course['starttime'].split(':')
    return parseInt(h[0])*60+parseInt(h[1])
}

function getEndTimeMinutes(course) {
    let h = course['endtime'].split(':')
    return parseInt(h[0])*60+parseInt(h[1])
}

function getRealEndTime(course) {
    let h = course['endtime'].split(':')
    if (parseInt(h[1]) != 0) 
        return h[0] + ' heures ' + h[1]
    else return h[0] + ' heures'
}

function getCurrentTime() {
    return date.getHours()*60+date.getMinutes()
}

function getTodayCourses(result) {
    let courses = result['timetable']['event']
    let todayCourses = []

    courses.forEach(course => {
        let courseDate = getCourseDate(course, result)

        if (courseDate.getDate() == day && courseDate.getMonth() == month) {
            todayCourses.push(course)
        }
    })

    return todayCourses
}

function getNextCourse(result) {
    let todayCourses = getTodayCourses(result)

    let takeFist = false
    if (hour >= 17) { //On est en fin de journée
        takeFist = true
        day += 1
    }

    if (takeFist) {
        return todayCourses[0] //On a les cours du lendemain donc on prend le premier
    }
    else { //Sinon on récup le plus proche de l'heure actuelle
        let less = 99999999
        let index = 0

        todayCourses.forEach((course, i) => {
            if (getStartTimeMinutes(course) > getCurrentTime() && getStartTimeMinutes(course) < less) {
                less = getStartTimeMinutes(course)
                index = i
            }
        })

        return todayCourses[index]
    }
}

function read(callback) {
    fs.readFile(path, (err, data) => {
        if (err) throw err

        let parser = xml.Parser({ explicitArray: false })
        parser.parseString(data, (err, result) => {
            if (err) throw err

            callback(result)
        })
    })
}

//Main part
function get(callback) {
    if (!(fs.existsSync(path))) {
        http.get(url, res => {
            let data = ''

            res.on('data', chunck => {
                data += chunck
            })

            res.on('end', () => {
                fs.writeFileSync(path, data)
                read(callback)
            })

            res.on('error', err => {
                throw err
            })
        })
    }
    else {
        read(callback)
    }
}

exports.get = get
exports.getNextCourse = getNextCourse
exports.getCourseDate = getCourseDate
exports.getTodayCourses = getTodayCourses
exports.getCourseName = getCourseName
exports.getEndTime = getRealEndTime