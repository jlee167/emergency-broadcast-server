import { Request, Response } from 'express';
import jwt = require('jsonwebtoken');
import LogService = require("../utils/facades/Logger");


export = {
  issueJwtToken: async (req :Request, res :Response, params :any) => {
    const options: jwt.SignOptions = {
      algorithm: 'HS256',
    };

    const token = jwt.sign(params.guardianID, params.privateKey, options);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Powered-By': 'bacon'
    });
    res.write(JSON.stringify({
      token: token,
    }));
    res.end();

    LogService.info(`[AUTH] JWT generated for: ${params.guardianID}`);
  },
};