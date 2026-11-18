package com.barilog.filters;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
@Component
public class DirectoryPrivacyHeadersFilter extends OncePerRequestFilter {
 @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
  if(request.getRequestURI().startsWith("/api/")) response.setHeader("Cache-Control","no-store");
  chain.doFilter(request,response);
 }
}
