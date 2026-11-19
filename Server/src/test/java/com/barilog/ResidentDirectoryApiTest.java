package com.barilog;

import com.barilog.entities.*;
import com.barilog.repositories.*;
import com.barilog.services.JwtService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import java.nio.file.*;
import java.math.BigDecimal;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class ResidentDirectoryApiTest {
 static Path database;
 static {try { database=Files.createTempFile("barilog-directory-test-", ".db");database.toFile().deleteOnExit();}catch(Exception e){throw new RuntimeException(e);}}
 @DynamicPropertySource static void properties(DynamicPropertyRegistry r){r.add("spring.datasource.url",()->"jdbc:sqlite:"+database+"?foreign_keys=on");r.add("spring.jwt.secret",()->"dGVzdFNlY3JldEtleUZvckJhcmlMb2dVbml0VGVzdHMyNTZiaXRzIQ==");}
 @Autowired WebApplicationContext context;
 @Autowired UserRepository users;
 @Autowired BuildingRepository buildings;
 @Autowired FloorRepository floors;
 @Autowired ApartmentRepository apartments;
 @Autowired JwtService jwt;
 MockMvc mvc;
 <T extends User> T account(T u,String name) {u.setName(name);u.setEmail(name+"@example.test");u.setPassword("unused-test-hash");u.setRole(u instanceof Manager ? "MANAGER" : u instanceof SecurityStaff ? "SECURITY" : u instanceof Admin ? "ADMIN" : u instanceof Staff ? "STAFF" : "RESIDENT");u.setPhoneNumber("+8801700112233");u.setIsActive(true);return users.saveAndFlush(u);}
 Building building(String name,User manager){Building b=new Building();b.setName(name);b.setAddress("Test road");b.setTotalFloors(2);b.setManager(manager);return buildings.saveAndFlush(b);}
 void occupy(Building b,Resident r,String unit){Floor f=new Floor();f.setBuilding(b);f.setFloorNumber(1);f.setBlockWing(unit);f=floors.saveAndFlush(f);Apartment a=new Apartment();a.setBuilding(b);a.setFloor(f);a.setUnitNumber(unit);a.setSizeSqft(BigDecimal.valueOf(900));a.setBhkType("2 BHK");a.setOccupancyStatus(OccupancyStatus.RENTED);a.setCurrentResident(r);apartments.saveAndFlush(a);}
 String bearer(User u){return "Bearer "+jwt.getAccessToken(u);}
 @BeforeEach void setup(){mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();}
 @Test void directoryConsentAssignmentsAndRevocation() throws Exception {
  Manager manager=account(new Manager(),"manager"); Resident alice=account(new Resident(),"alice");Resident bob=account(new Resident(),"bob");SecurityStaff guard=account(new SecurityStaff(),"guard");
  Building a=building("Building A",manager),b=building("Building B",manager);occupy(a,alice,"1A");occupy(a,bob,"1B");
  String path="/api/buildings/"+a.getId(), other="/api/buildings/"+b.getId();
  mvc.perform(get(path+"/directory")).andExpect(status().isUnauthorized());
  mvc.perform(get(path+"/directory").header("Authorization",bearer(bob))).andExpect(status().isOk()).andExpect(jsonPath("$[0].phoneNumber").isEmpty()).andExpect(jsonPath("$[0].phoneVisibility").value("HIDDEN"));
  mvc.perform(put("/api/directory/me/preferences").header("Authorization",bearer(alice)).contentType("application/json").content("{\"sharePhone\":true,\"shareEmail\":false,\"shareEmergencyContacts\":false}")).andExpect(status().isOk());
  mvc.perform(get(path+"/directory").header("Authorization",bearer(bob))).andExpect(jsonPath("$[0].phoneNumber").value("+8801700112233")).andExpect(jsonPath("$[0].email").isEmpty());
  mvc.perform(get("/api/apartments").param("buildingId",a.getId().toString()).header("Authorization",bearer(bob))).andExpect(status().isOk()).andExpect(jsonPath("$[0].currentResidentEmail").isEmpty());
  mvc.perform(get("/api/users").header("Authorization",bearer(manager))).andExpect(status().isOk()).andExpect(jsonPath("$[0].email").isEmpty()).andExpect(jsonPath("$[0].phoneNumber").isEmpty());
  String emergency=path+"/directory/"+alice.getId()+"/emergency";
  mvc.perform(put(emergency).header("Authorization",bearer(manager)).contentType("application/json").content("{\"bloodGroup\":\"O+\",\"emergencyContactName\":\"Parent\",\"emergencyContactPhone\":\"01700000000\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.bloodGroup").value("O+"));
  mvc.perform(put(emergency).header("Authorization",bearer(manager)).contentType("application/json").content("{\"bloodGroup\":\"C+\"}")).andExpect(status().isBadRequest());
  mvc.perform(put(emergency).header("Authorization",bearer(manager)).contentType("application/json").content("{\"physicianName\":\"Doctor\"}")).andExpect(status().isBadRequest());
  mvc.perform(get(emergency).header("Authorization",bearer(bob))).andExpect(jsonPath("$.visibility").value("HIDDEN")).andExpect(jsonPath("$.bloodGroup").isEmpty());
  mvc.perform(put(emergency).header("Authorization",bearer(alice)).contentType("application/json").content("{}")).andExpect(status().isForbidden());
  mvc.perform(put(path+"/security-assignments/"+guard.getId()).header("Authorization",bearer(manager))).andExpect(status().isOk());
  String guardToken=bearer(guard);
  mvc.perform(get(emergency).header("Authorization",guardToken)).andExpect(status().isOk()).andExpect(jsonPath("$.bloodGroup").value("O+"));
  mvc.perform(get(other+"/directory").header("Authorization",guardToken)).andExpect(status().isForbidden());
  mvc.perform(get(other+"/floors").header("Authorization",guardToken)).andExpect(status().isForbidden());
  mvc.perform(delete(path+"/security-assignments/"+guard.getId()).header("Authorization",bearer(manager))).andExpect(status().isNoContent());
  mvc.perform(get(emergency).header("Authorization",guardToken)).andExpect(status().isForbidden());
  mvc.perform(put("/api/directory/me/preferences").header("Authorization",bearer(alice)).contentType("application/json").content("{\"sharePhone\":true}")).andExpect(status().isBadRequest());
  mvc.perform(post("/api/users/register").contentType("application/json").content("{\"name\":\"Bad Admin\",\"email\":\"bad@example.test\",\"password\":\"password123\",\"role\":\"ADMIN\"}")).andExpect(status().isBadRequest());
 }
 @Test void validationRolesMultipleResidencyAndMoveOut() throws Exception {
  Manager manager=account(new Manager(),"manager2"), outsider=account(new Manager(),"outsider");
  Admin admin=account(new Admin(),"admin"); Staff technician=account(new Staff(),"technician");
  Resident resident=account(new Resident(),"resident2");
  Building a=building("Building C",manager), b=building("Building D",manager);
  occupy(a,resident,"C1");occupy(a,resident,"C2");occupy(b,resident,"D1");
  String path="/api/buildings/"+a.getId(), emergency=path+"/directory/"+resident.getId()+"/emergency";
  mvc.perform(get(path+"/directory").header("Authorization",bearer(resident))).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].units.length()").value(2));
  mvc.perform(get("/api/directory/buildings").header("Authorization",bearer(resident))).andExpect(jsonPath("$.length()").value(2));
  mvc.perform(get(path+"/directory").header("Authorization",bearer(technician))).andExpect(status().isForbidden());
  mvc.perform(get(emergency).header("Authorization",bearer(outsider))).andExpect(status().isForbidden());
  mvc.perform(put(emergency).header("Authorization",bearer(manager)).contentType("application/json").content("{\"bloodGroup\":\"C+\"}")).andExpect(status().isBadRequest());
  mvc.perform(put(emergency).header("Authorization",bearer(manager)).contentType("application/json").content("{\"emergencyContactName\":\"Parent\"}")).andExpect(status().isBadRequest());
  mvc.perform(put(emergency).header("Authorization",bearer(manager)).contentType("application/json").content("{\"physicianPhone\":\""+"1".repeat(31)+"\"}")).andExpect(status().isBadRequest());
  mvc.perform(get(path+"/directory/99999/emergency").header("Authorization",bearer(manager))).andExpect(status().isNotFound());
  mvc.perform(put(path+"/manager").header("Authorization",bearer(manager)).contentType("application/json").content("{\"managerId\":"+outsider.getId()+"}")).andExpect(status().isForbidden());
  mvc.perform(put(path+"/manager").header("Authorization",bearer(admin)).contentType("application/json").content("{\"managerId\":"+outsider.getId()+"}")).andExpect(status().isOk());
  for(Apartment apartment:apartments.findByBuildingId(a.getId())){apartment.setOccupancyStatus(OccupancyStatus.VACANT);apartment.setCurrentResident(null);apartments.saveAndFlush(apartment);}
  mvc.perform(get(path+"/directory").header("Authorization",bearer(resident))).andExpect(status().isForbidden());
  mvc.perform(get("/api/directory/buildings").header("Authorization",bearer(resident))).andExpect(jsonPath("$.length()").value(1));
  resident.setIsActive(false);users.saveAndFlush(resident);
  mvc.perform(get("/api/directory/me/preferences").header("Authorization",bearer(resident))).andExpect(status().isForbidden());
 }

}
