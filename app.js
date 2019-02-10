const express = require('express')
const multer = require('multer')
const mime = require('mime')
const fs = require('fs')
const app = express()
const port = process.env.PORT || 3000
const origins = process.env.ORIGINS || '*'
const p_dir = './images/profiles'
const r_dir = './images/recipes'
const validTypes =[
  "jpeg",
  "svg",
  "png"
]

if (!fs.existsSync('./images')){
  fs.mkdirSync('./images');
}

if (!fs.existsSync(p_dir)){
  fs.mkdirSync(p_dir);
}

if (!fs.existsSync(r_dir)){
  fs.mkdirSync(r_dir);
}

const profilesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/profiles/')
  },
  filename: (req, file, cb) => {
    let type = mime.getExtension(file.mimetype)
    if (!validTypes.includes(type)) {
      cb(null, `profile-${Date.now()}`)
    } else {
      cb(null, `profile-${Date.now()}.${type}`)
    }
  }
})

const recipesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/recipes/')
  },
  filename: (req, file, cb) => {
    let type = mime.getExtension(file.mimetype)
    if (!validTypes.includes(type)) {
      cb(null, `recipe-${Date.now()}`)
    } else {
      cb(null, `recipe-${Date.now()}.${type}`)
    }
  }
})

const profiles = multer({ storage: profilesStorage })
const recipes = multer({ storage: recipesStorage })

app.use(express.static('images'))

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', origins)
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-type')
  if ('OPTIONS' == req.method) {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.post('/profiles', profiles.single('profile'), (req, res, next) => {
  let type = mime.getExtension(req.file.mimetype)
  if (!validTypes.includes(type)) {
    return next({ files: [req.file] })
  }
  res.status(200).json({ profile_img: req.file.destination + req.file.filename })
})

app.post('/recipes', recipes.array('recipes'), (req, res, next) => {
  let addrs = [], type = ''

  for (file of req.files) {
    type = mime.getExtension(file.mimetype)
    if (!validTypes.includes(type)) {
      return next({ files: req.files })
    }
    addrs.push(file.destination + file.filename)
  }

  res.status(200).json({ recipe_imgs: addrs })
})

app.use((err, req, res, next) => {
  for (file of err.files) {
    fs.unlink(file.destination + file.filename, (err) => {
      if (err) throw err;
      console.log('file was deleted')
    });
  }
  res.status(400).json({
    status: 400,
    message: 'BAD REQUEST'
  })
})

// URL Not found
app.use((req, res, next) => {
  res.status(404).json({
    status: 404,
    message: 'NOT FOUND'
  })
})

app.listen(port, () => {
  console.log(`Images microservice running on port ${port}`)
})
