import { Injectable, Body } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthCredentialDto } from './Dto/auth.credential.dto';
import { UserTypeNames } from 'src/master-data/user-type/user-type-names.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    console.log('AuthService.validateUser ===============');

    const user = await this.usersService.findByUserName(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(authCredentialDto: AuthCredentialDto): Promise<any> {
    console.log('=====AuthService.login======');
    const { username, password } = authCredentialDto;
   
    if (await this.usersService.validateUser(username, password)) {
      const selectedUser = await this.usersService.findByUserName(username);
      // console.log('usestype',selectedUser )
      // console.log('selectedUser',!([1,2,8,9].includes(selectedUser.userType.id)))
      // console.log('inst',([8,9].includes(selectedUser.userType.id)))
      console.log("selectedUser",selectedUser)
      if (selectedUser.status === 0){
        if (selectedUser.institution.status === 0){
          if(selectedUser.institution.country.countryStatus !="Deactivated"){
            const payload = {
              usr: (await selectedUser).username,
              fname: selectedUser.firstName,
              lname: selectedUser.lastName,
              countryId: selectedUser.country.id,
              instName: selectedUser.institution.name,
              moduleLevels: [selectedUser.country.climateActionModule ? 1 : 0, selectedUser.country.ghgModule ? 1 : 0, selectedUser.country.macModule ? 1 : 0, selectedUser.country.dataCollectionModule ? 1 : 0, selectedUser.country.dataCollectionGhgModule ? 1 : 0],              ...!([UserTypeNames.CountryAdmin, UserTypeNames.Verifier, UserTypeNames.InstitutionAdmin, UserTypeNames.DataEntryOperator].includes(selectedUser.userType.id)) && { sectorId: selectedUser.institution.sectorId },
              // ...!([1,2,8,9].includes(selectedUser.userType.id)) &&{ sectorId:selectedUser.institution.sectorId},
              ...([UserTypeNames.InstitutionAdmin, UserTypeNames.DataEntryOperator].includes(selectedUser.userType.id)) && { institutionId: selectedUser.institution.id },
              // ...([8,9].includes(selectedUser.userType.id)) &&{ institutionId:selectedUser.institution.id},
              roles: [selectedUser.userType.name],
            };
    
    
            // console.log('jwt payload ', payload);
    
            const expiresIn = '240h';
            let token = this.jwtService.sign(payload, { expiresIn });
            console.log('token', token);
            return { access_token: token };
          }
          else{
            return {error: "Country is deactivated"};
          }
          
        } else {
          return {error: "Institution is deactivated"};
        }
      } else {
        return {error: "User is deactivated"};
      }
    } else {
      return {error: "Invalid credentials"};
    }
  }
}
