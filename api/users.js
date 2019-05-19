const router = require('express').Router();

const { getBusinessesByOwnerId } = require('../models/business');
const { getReviewsByUserId } = require('../models/review');
const { getPhotosByUserId } = require('../models/photo');
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { UserSchema, insertNewUser, getUserById, validateUser } = require('../models/user');


router.post('/login', async (req, res) => {
  if (req.body && req.body.email && req.body.password) {
    try {
      const user = await validateUser(req.body.email, req.body.password);
      if (user != null) {
        const token = generateAuthToken(user.id, user.email, user.admin);
        res.status(200).send({
          token: token
        });
      } else {
        res.status(401).send({
          error: "Invalid credentials"
        });
      }
    } catch (err) {
      res.status(500).send({
        error: "Error validating user. Try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body was invalid"
    });
  }
});

/*
 * Route to create a user
 */
 router.post('/', requireAuthentication, async (req, res) => {
   const newUser = req.body;
   if (validateAgainstSchema(newUser, UserSchema)) {
     if (!newUser.admin) {
       newUser.admin = 0;
     }
   } else {
     res.status(400).send({
       error: "Request body is not a valid user."
     });
   }

   if ((req.user != null && ((req.user.admin === 1 && (newUser.admin === 0 || newUser.admin === 1))
   || (req.user.admin === 0 && newUser.admin === 0))) || (req.user == null && newUser.admin === 0)) {
     try {
       const id = await insertNewUser(newUser);
       res.status(201).send({
         _id: id
       });
     } catch (err) {
       console.error(err);
       res.status(500).send({
         error: "Error inserting user to DB. Please try again later."
       });
     }
   } else {
     res.status(403).send({
       error: "Unauthorized to create account"
     });
   }
 });

/*
 * Route to get user detail by id
 */
router.get('/:id', requireAuthentication, async (req, res, next) => {
  if (req.user != null && (req.user.admin === 1 || req.user.sub == req.params.id)) {
    try {
      const user = await getUserById(req.user.email);
      if (user) {
        res.status(200).send(user);
      } else {
        next();
      }
    } catch (err) {
      console.error("  -- Error:", err);
      res.status(500).send({
        error: "Error fetching user. Try again later."
      });
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
});

/*
 * Route to list all of a user's businesses.
 */
router.get('/:id/businesses', requireAuthentication, async (req, res, next) => {
  if (req.user != null && (req.user.admin === 1 || req.user.sub == req.params.id)) {
    try {
      const businesses = await getBusinessesByOwnerId(parseInt(req.params.id));
      if (businesses) {
        res.status(200).send({ businesses: businesses });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch businesses.  Please try again later."
      });
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:id/reviews', requireAuthentication, async (req, res, next) => {
  if (req.user != null && (req.user.admin === 1 || req.user.sub == req.params.id)) {
    try {
      const reviews = await getReviewsByUserId(parseInt(req.params.id));
      if (reviews) {
        res.status(200).send({ reviews: reviews });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch reviews.  Please try again later."
      });
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:id/photos', requireAuthentication, async (req, res, next) => {
  if (req.user != null && (req.user.admin === 1 || req.user.sub == req.params.id)) {
    try {
      const photos = await getPhotosByUserId(parseInt(req.params.id));
      if (photos) {
        res.status(200).send({ photos: photos });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch photos.  Please try again later."
      });
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
});

module.exports = router;
