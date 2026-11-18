package com.barilog;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.flywaydb.core.Flyway;
import java.nio.file.Path;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;
class ResidentDirectoryPersistenceTest {
 @TempDir Path temp;
 @Test void upgradesWithoutLosingEmergencyDataAndEnforcesAssignmentKeys() throws Exception {
  String url="jdbc:sqlite:"+temp.resolve("upgrade.db")+"?foreign_keys=on";
  Flyway.configure().dataSource(url,null,null).target("3").load().migrate();
  try(Connection c=DriverManager.getConnection(url);Statement s=c.createStatement()){
   s.executeUpdate("INSERT INTO users(id,name,email,password,role) VALUES(1,'Resident','r@test','hash','RESIDENT'),(2,'Guard','g@test','hash','SECURITY')");
   s.executeUpdate("INSERT INTO resident(id,blood_group,emergency_contact_name,emergency_contact_phone) VALUES(1,'O+','Parent','01700000000')");
   s.executeUpdate("INSERT INTO security_staff(id) VALUES(2)");
   s.executeUpdate("INSERT INTO buildings(id,name,address,total_floors) VALUES(1,'A','Test',2)");
  }
  Flyway migration=Flyway.configure().dataSource(url,null,null).load();migration.migrate();
  try(Connection c=DriverManager.getConnection(url);Statement s=c.createStatement()){
   try(ResultSet r=s.executeQuery("SELECT * FROM resident WHERE id=1")){assertTrue(r.next());assertEquals("O+",r.getString("blood_group"));assertEquals("Parent",r.getString("emergency_contact_name"));assertEquals(0,r.getInt("share_phone"));assertEquals(0,r.getInt("share_email"));assertEquals(0,r.getInt("share_emergency_contacts"));}
   s.executeUpdate("INSERT INTO building_security_assignments VALUES(1,2)");
   assertThrows(SQLException.class,()->s.executeUpdate("INSERT INTO building_security_assignments VALUES(1,2)"));
   s.executeUpdate("DELETE FROM users WHERE id=2");
   try(ResultSet r=s.executeQuery("SELECT COUNT(*) FROM building_security_assignments")){assertTrue(r.next());assertEquals(0,r.getInt(1));}
   try(ResultSet r=s.executeQuery("PRAGMA foreign_key_check")){assertFalse(r.next());}
  }
  assertEquals(0,migration.migrate().migrationsExecuted);
 }
}
