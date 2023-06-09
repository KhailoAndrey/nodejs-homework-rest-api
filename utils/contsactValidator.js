const Joi = require('joi');

exports.createContactValidator = (data) => Joi.object()
    .options({abortEarly: false})
    .keys({
    name: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    phone: Joi.string().min(7).max(15).required(),
    })
    .validate(data);

exports.updateContactValidator = (data) => Joi.object()
    .options({abortEarly: false})
    .keys({
    name: Joi.string()
        .alphanum()
        .min(3)
        .max(30),        
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
    phone: Joi.string().min(7).max(15),
    })
    .validate(data);
