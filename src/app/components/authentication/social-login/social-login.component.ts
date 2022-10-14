import { HttpService } from 'src/app/services/http/http.service';
import { Component, OnInit } from '@angular/core';

import {ActivatedRoute,Router} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-social-login',
  templateUrl: './social-login.component.html',
  styleUrls: ['./social-login.component.scss']
})
export class SocialLoginComponent implements OnInit {

  constructor(private request: HttpService,private route: ActivatedRoute,private http: HttpClient, private router: Router,private auth : AuthService) { }

  ngOnInit(): void {
    this.getToken();
  }

  wmsLogin(userData) {

    //console.log("userData ",userData);

    let wmsParams = {
      email : environment.wmsLogin.userId,
      password : environment.wmsLogin.password,
      auth:false
    };

    this.request.postwms("auth/login", wmsParams).subscribe(
      (wmsData: any) => {
        
        ///////
        this.auth.setWMSToken(wmsData); 
        this.auth.setToken(userData);
        this.auth.setUserData(userData);
        this.router.navigate(['']);
    });
  }

  getToken(){ 
    this.route.queryParams.subscribe(params => {

      
      if(JSON.parse(window.atob(params.state)).auth=="facebook"){
        
        this.http.post<any>(environment.apiURL+environment.fbAuth.backendApi, {clientID: environment.fbAuth.appID,code:params.code,state:params.state, from_srf: 1,redirectUri:window.origin+environment.fbAuth.redirect_uri }).subscribe(data => {
          
          if("otp_confirmed" in data){

            this.router.navigate(['/register'], { state: { authState:true , token:data.token, id:data.id, first_name:data.first_name } });
          }
          else{
            this.wmsLogin(data);
            
            //window.location.href = environment.tokenLoginUrl+"?token="+data['token'];
          }

          

        },errors => {
          
          this.router.navigate(['']);
        });
      }
      else if(JSON.parse(window.atob(params.state)).auth=="google"){
        this.http.post<any>(environment.apiURL+environment.googleAuth.backendApi, {clientID: environment.googleAuth.ClientID,code:params.code,state:params.state, from_srf: 1,redirectUri:window.origin+environment.googleAuth.redirect_uri }).subscribe(data => {
          
           if("otp_confirmed" in data){
            this.router.navigate(['/register'], { state: { authState:true , token:data.token, id:data.id, first_name:data.first_name } });
           }
           else{
             //console.log("else part of google login...");
            //this.auth.setToken(data);
            this.wmsLogin(data);
            //this.auth.setUserData(data);
            //this.router.navigate(['']);
            //window.location.href = environment.tokenLoginUrl+"?token="+data['token'];  
           }

          

        },errors => {
          
          this.router.navigate(['']);
        });
      }
      /**/
  
      
    });
  }

}
