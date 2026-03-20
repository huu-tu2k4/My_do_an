import db from '../models/index';
import CRUDService from '../services/CRUDService';

let getHomePage = async (req, res) => {
    try {
        let users = await db.User.findAll({
            raw: true,
        });

        return res.render("homePage.ejs", {
            data: users
        });
    } catch(error) {
        console.log(error);
    }    
}

let getCRUD = async (req, res) => {
    return res.render('crud.ejs');
}

let displayCRUD = async (req, res) => {
    let data = await CRUDService.getAllUsers();
    return res.render('displayCRUD.ejs', {
        data: data,
    });
}

let editCRUD = async (req, res) => {
    let id = req.query.id;
    if(id){
        let userData = await CRUDService.displayUserId(id);
        
        return res.render('editCRUD.ejs', {
            userData: userData,
        });
    }
    else{
        return res.send("User not found!!!")
    }
    
}

let postCRUD = async (req, res) => {
    let message = await CRUDService.createNewUser(req.body);
    console.log(message);
    return res.send('post crud from server');
}

let putCRUD = async (req, res) => {
    console.log(req.body);
    let allUsers = await CRUDService.updateUser(req.body);
    return res.render('displayCRUD.ejs', {
        data: allUsers,
    });
}

let deleteCRUD = async (req, res) => {
    let id = req.query.id;
    if(id){
        await CRUDService.deleteUserById(id);
        return res.redirect('/get-crud');
    }
    else{
        return res.send('User not found!!!')
    }
}

module.exports = {
    getHomePage: getHomePage,
    getCRUD: getCRUD,
    postCRUD: postCRUD,
    displayCRUD: displayCRUD,
    editCRUD: editCRUD,
    putCRUD: putCRUD,
    deleteCRUD: deleteCRUD,
}