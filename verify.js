import jwt from 'jsonwebtoken';
import url from 'url'

async function verifyToken(req,next) {
  let token = req.headers.authorization;
  if(!token){
  const query = url.parse(req.url, true).query;
  token = query.token;}
if (!token){console.log('token error no token');return false}
try{
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    return next(decoded.userName);
} catch (err) {
    console.log('Token verification error:', err.message);
    return false;
}
}



export {verifyToken}